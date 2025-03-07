import { createContext, useContext, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  
  const joinRoom = async (roomId, userId) => {
    try {
      // const APP_ID = process.env.APP_ID;
      // const TOKEN = process.env.TOKEN;
      const APP_ID = '64a94f2417fa4dd8bdc069f102dfc6c5'
      const TOKEN = '007eJxTYHjUEtL73cDkUIxPhbLLW/mPr1TSWr+n1TwOOdpf6+9Y/12Bwcwk0dIkzcjE0Dwt0SQlxSIpJdnAzDLN0MAoJS3ZLNk0X2BtekMgI8POhvvMjAwQCOKrMJhamhpbmhka6xqnJZnrmqQlJeomGpkk6SaZmxkamqaZpKYlmjIwAABfDikc'

      await client.join(APP_ID, roomId, TOKEN, userId);
      const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([microphoneTrack]);
      setLocalAudioTrack(microphoneTrack);
      console.log("Joined Voice Room");
      setIsInCall(true);
    } catch (err) {
      console.error("Failed to join voice room:", err);
    }
  };

  // Leave the voice call
  const leaveRoom = async () => {
    if (localAudioTrack) {
      localAudioTrack.close();
      await client.leave();
      setLocalAudioTrack(null);
      setRemoteUsers([]);
      setIsInCall(false);
    }
  };

  // Toggle microphone mute
  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Listen for remote users
  useEffect(() => {
    const handleUserJoined = (user) => {
      setRemoteUsers((prev) => [...prev, user]);
    };

    const handleUserLeft = (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    client.on("user-published", handleUserJoined);
    client.on("user-unpublished", handleUserLeft);

    return () => {
      client.off("user-published", handleUserJoined);
      client.off("user-unpublished", handleUserLeft);
    };
  }, []);
  useEffect(() => {
    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    };

    client.on("user-published", handleUserPublished);
    return () => client.off("user-published", handleUserPublished);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        joinRoom,
        leaveRoom,
        toggleMute,
        isMuted,
        isInCall,
        remoteUsers,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
