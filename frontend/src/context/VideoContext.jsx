import { createContext, useContext, useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const localPlayerRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef({ audio: null, video: null });

  useEffect(() => {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    return () => {
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);


const joinRoom = async (roomId, userId) => {
    try {
      if (isInCall) return;

      const APP_ID = import.meta.env.VITE_APP_ID;
      const TOKEN = import.meta.env.VITE_TOKEN;
      if (!APP_ID || !TOKEN) {
        throw new Error("Missing Agora APP_ID or TOKEN");
      };
      

      await cleanupTracks();

      await clientRef.current.join(APP_ID, roomId, TOKEN, userId);
      
      const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await clientRef.current.publish([microphoneTrack]);
      tracksRef.current.audio = microphoneTrack;
      
      const cameraTrack = await AgoraRTC.createCameraVideoTrack();
      await clientRef.current.publish([cameraTrack]);
      tracksRef.current.video = cameraTrack;
      
      if (localPlayerRef.current) {
        cameraTrack.play(localPlayerRef.current);
      }

      setLocalAudioTrack(microphoneTrack);
      setLocalVideoTrack(cameraTrack);
      setIsInCall(true);
      setIsVideoOn(true);
    } catch (err) {
      console.error("Failed to join video room:", err);
      await cleanupTracks();
      if (clientRef.current) {
        await clientRef.current.leave();
      }
    }
  };

  const cleanupTracks = async () => {
    if (tracksRef.current.audio) {
      tracksRef.current.audio.stop();
      tracksRef.current.audio.close();
      tracksRef.current.audio = null;
    }
    if (tracksRef.current.video) {
      tracksRef.current.video.stop();
      tracksRef.current.video.close();
      tracksRef.current.video = null;
    }
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
  };

  const leaveRoom = async () => {
    try {
      if (!isInCall) return;

      await cleanupTracks();
      await clientRef.current.leave();
      
      setRemoteUsers([]);
      setIsInCall(false);
      
      const remoteContainer = document.getElementById('remote-videos-container');
      if (remoteContainer) {
        remoteContainer.innerHTML = '';
      }
    } catch (err) {
      console.error("Failed to leave room:", err);
    }
  };

  const toggleMute = () => {
    if (tracksRef.current.audio) {
      tracksRef.current.audio.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isInCall) return;

      if (isVideoOn) {
        if (tracksRef.current.video) {
          await clientRef.current.unpublish([tracksRef.current.video]);
          tracksRef.current.video.stop();
          tracksRef.current.video.close();
          tracksRef.current.video = null;
          setLocalVideoTrack(null);
        }
      } else {
        const cameraTrack = await AgoraRTC.createCameraVideoTrack();
        await clientRef.current.publish([cameraTrack]);
        tracksRef.current.video = cameraTrack;
        if (localPlayerRef.current) {
          cameraTrack.play(localPlayerRef.current);
        }
        setLocalVideoTrack(cameraTrack);
      }
      setIsVideoOn(!isVideoOn);
    } catch (err) {
      console.error("Error toggling video:", err);
      setIsVideoOn(isVideoOn); 
    }
  };
  useEffect(() => {
    if (!clientRef.current) return;

    
    const handleUserPublished = async (user, mediaType) => {
        try {
          await clientRef.current.subscribe(user, mediaType);
          
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
          
          if (mediaType === 'video') {
            const existingContainer = document.getElementById(`player-${user.uid}`);
            if (existingContainer) {
              existingContainer.remove();
            }
            
            const remotePlayerContainer = document.createElement('div');
            remotePlayerContainer.id = `player-${user.uid}`;
            remotePlayerContainer.className = 'remote-video-container';
            document.getElementById('remote-videos-container').appendChild(remotePlayerContainer);
            
            user.videoTrack.play(remotePlayerContainer);
          }
          
          setRemoteUsers(prev => {
            const existingUser = prev.find(u => u.uid === user.uid);
            if (existingUser) {
              return prev.map(u => u.uid === user.uid ? { ...u, [mediaType]: true } : u);
            }
            return [...prev, { ...user, [mediaType]: true }];
          });
        } catch (err) {
          console.error("Failed to handle user published:", err);
        }
      };
      
      const handleUserUnpublished = async (user, mediaType) => {
        if (mediaType === 'video') {
          const playerContainer = document.getElementById(`player-${user.uid}`);
          if (playerContainer) {
            playerContainer.remove();
          }
        }
        
        setRemoteUsers(prev => {
          const updatedUsers = prev.map(u => {
            if (u.uid === user.uid) {
              return { ...u, [mediaType]: false };
            }
            return u;
          }).filter(u => u.audio || u.video);
          
          return updatedUsers;
        });
      };

    clientRef.current.on("user-published", handleUserPublished);
    clientRef.current.on("user-unpublished", handleUserUnpublished);
    clientRef.current.on("user-left", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      const playerContainer = document.getElementById(`player-${user.uid}`);
      if (playerContainer) {
        playerContainer.remove();
      }
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.off("user-published", handleUserPublished);
        clientRef.current.off("user-unpublished", handleUserUnpublished);
        clientRef.current.off("user-left");
      }
    };
  }, []);

  return (
    <VideoContext.Provider
      value={{
        joinRoom,
        leaveRoom,
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoOn,
        isInCall,
        remoteUsers,
        localPlayerRef,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
