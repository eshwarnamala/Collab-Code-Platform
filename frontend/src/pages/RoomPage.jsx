import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Editor from "@monaco-editor/react";
import FileExplorer from "../components/FileExplorer";
import socket from "../utils/socket";
import { getUserColor } from "../utils/colors";
import throttle from "lodash.throttle";
import { useVoice } from "../context/VoiceContext";
import { useVideo } from "../context/VideoContext";

import "./RoomPage.css";


const API = "https://collab-code-platform-server.onrender.com/api"
// const API = "http:localhost:5000/api/"


const RoomPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // const { joinRoom, leaveRoom, toggleMute, isMuted, isInCall, remoteUsers } =
  //   useVoice();
  const {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOn,
    isInCall,
    remoteUsers,
    localPlayerRef,
  } = useVideo();
  const { user } = useAuth();
  const { roomId } = useParams();
  const [currentFile, setCurrentFile] = useState(null);
  const [code, setCode] = useState("");
  const [remoteCursors, setRemoteCursors] = useState({});
  const editorRef = useRef(null);
  //   const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [decorations, setDecorations] = useState([]);
  const [input, setInput] = useState("");

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const currentFileRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const cursorTimers = useRef({});



  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch(`${API}/rooms/${roomId}/files`);
      const data = await response.json();

      const path = searchParams.get("path") || "/";
      const file = searchParams.get("file");

      if (file) {
        const selectedFile = data.find(
          (f) => f.name === file && f.path === path
        );
        if (selectedFile) {
          setCurrentFile(selectedFile);
          setCode(selectedFile.content); 
          // editorRef.current = null; 
        }
      }
    };
    fetchFiles();
  }, [roomId, searchParams]);

  useEffect(() => {
    if (user?._id) {
      joinRoom(roomId, user._id);
    }
    return () => {
      leaveRoom();
    };
  }, [user, roomId]);

  useEffect(() => {
    // const handleCursorUpdate = ({ cursor, userId, username}) => {
    //   // if(!currentFile || currentFile.path !== filePath) return
    //   console.log("Remote cursor update:", userId, cursor);
    //   setRemoteCursors((prev) => ({
    //     ...prev,
    //     [userId]: { ...cursor, username, color: getUserColor(userId) }, // Overwrite old position
    //   }));
    // };

    const handleCursorUpdate = ({ cursor, userId, username, filePath, fileName }) => {
      const current = currentFileRef.current;
    
      if (
        current &&
        current.path === filePath &&
        current.name === fileName
      ) {
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { ...cursor, username, color: getUserColor(userId) },
        }));
      }
    }

    // socket.on("cursor-update", handleCursorUpdate);
    socket.on("cursor-update", ({ cursor, userId, username, filePath, fileName }) => {
      const current = currentFileRef.current;
    
      if (
        current &&
        current.path === filePath &&
        current.name === fileName
      ) {
        if (cursorTimers.current[userId]) {
          clearTimeout(cursorTimers.current[userId]);
        }
    
        cursorTimers.current[userId] = setTimeout(() => {
          setRemoteCursors((prev) => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        }, 0);
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { ...cursor, username, color: getUserColor(userId) },
        }));
      }
    });
    
    return () => {
      socket.off("cursor-update", handleCursorUpdate);
      Object.values(cursorTimers.current).forEach(clearTimeout);
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(cursorTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
    
    // console.log("Editor mounted");
    // console.log("Editor mounted for file:", currentFile.name);
    
    const throttledEmitCursor = throttle(({ cursor, filePath, fileName }) => {
      socket.emit("cursor-position", {
        roomId,
        cursor,
        filePath,
        fileName,
        userId: user._id,
        username: user.username,
      });
    }, 100);

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
      async () => {
        const code = editor.getValue();
        const selection = editor.getSelection();
        const selectedCode = code.substring(0, selection.positionColumn);

        setIsLoadingSuggestion(true);
        try {
          const response = await fetch(`${API}/ai/suggest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: selectedCode,
              language: currentFile.language,
            }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch suggestion");
          }

          // setAiSuggestion(data.suggestion);
          setAiSuggestion(data.suggestion.replace(/\r\n/g, "\n"));
        } catch (err) {
          setAiSuggestion("Error: " + err.message);
        } finally {
          setIsLoadingSuggestion(false);
        }
      }
    );

   
    editor.onDidChangeCursorPosition((e) => {
      const cursor = {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      };
      throttledEmitCursor({
        cursor,
        filePath: currentFile.path,
        fileName: currentFile.name,
      });
    });
    
  };

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("code-update", ({ code, filePath, fileName }) => {
      const current = currentFileRef.current;

      if (current && current.path === filePath && current.name === fileName) {
        isRemoteUpdate.current = true;
        if (editorRef.current && isRemoteUpdate.current) {
          const currentVal = editorRef.current.getValue();
          if (currentVal !== code) {
            const cursorPos = editorRef.current.getPosition();
            editorRef.current.setValue(code);
    
            if (cursorPos) {
              editorRef.current.setPosition(cursorPos);
            }
          }
        }
        setCode(code);
      }
    });

    return () => {
      socket.off("code-update");
    };
  }, [roomId, currentFile]);



  useEffect(() => {
    if (!editorRef.current) return;

    const oldDecorations = [...decorations];
    const newDecorations = Object.values(remoteCursors).map((cursor) => {
      return {
        range: new monaco.Range(
          cursor.lineNumber,
          cursor.column,
          cursor.lineNumber,
          cursor.column
        ),
        options: {
          className: "remote-cursor",
          glyphMarginClassName: "remote-cursor-margin",
          hoverMessage: { value: `**${cursor.username}**` },
          stickiness: 1,
          inlineStyle: { borderLeftColor: cursor.color },
        },
      };
    });

    const decorationIds = editorRef.current.deltaDecorations(
      oldDecorations,
      newDecorations
    );
    setDecorations(decorationIds);
  }, [remoteCursors]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.deltaDecorations(decorations, []);
      }
    };
  }, []);

  const debouncedSaveFile = useRef(
    throttle(async (value, fileName, filePath) => {
      try {
        const response = await fetch(`${API}/rooms/${roomId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: fileName,
            content: value,
            path: filePath,
          }),
        });
  
        const data = await response.json();
        // console.log("Backend response:", data);
  
        if (!response.ok) {
          throw new Error(data.error || "Failed to save file");
        }
      } catch (err) {
        console.error("Error saving file:", err);
      }
    }, 3000)
  ).current;


  const debouncedEmitCode = useRef(
    throttle((roomId, value, path, name) => {
      socket.emit("code-change", {
        roomId,
        code: value,
        filePath: path,
        fileName: name,
      });
    }, 2000) 
  ).current;
  
  

  const handleFileChange = async (value) => {
    if (!currentFile) return;
    isRemoteUpdate.current = false;
    setCode(value);

    debouncedEmitCode(roomId, value, currentFile.path, currentFile.name);
    debouncedSaveFile(value, currentFile.name, currentFile.path);
    
  
  };



  // Execute code
  const [executionResult, setExecutionResult] = useState({
    output: "",
    language: "",
    version: "",
  });

  const handleExecute = async () => {
    if (!currentFile || currentFile.isFolder) return;

    setIsExecuting(true);
    setExecutionResult({ output: "", language: "", version: "" }); 

    try {
      const response = await fetch(`${API}/rooms/${roomId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          //   code: currentFile.content,
          code: code,
          language: currentFile.language,
          input: input,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      setExecutionResult({
        output: data.output || "No output",
        language: data.language,
        version: data.version,
      });
    } catch (err) {
      setExecutionResult({
        output: "Error executing code",
        language: "",
        version: "",
      });
    } finally {
      setIsExecuting(false);
    }
  };
  const handleSave = async () => {
    if (!currentFile) return;
  
    try {
      const response = await fetch(`${API}/rooms/${roomId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: currentFile.name,
          content: code,
          path: currentFile.path,
        }),
      });
  
      const data = await response.json();
      // console.log("Saved file:", data);
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to save file");
      }
    } catch (err) {
      console.error("Error saving file:", err);
    }
  };
  
  return (
    <div className="room-page">
      <h1>{`Room #${roomId}`}</h1>
      <p>Welcome, {user.username}!</p>
      <div className="video-controls">
        
        <div className="video-container">
          <div ref={localPlayerRef} className="local-video">
            {!isVideoOn && (
              <div className="video-off-placeholder">Your video is off</div>
            )}
          </div>
          <div id="remote-videos-container" className="remote-videos">
            {remoteUsers.map(
              (user) =>
                !user.video && (
                  <div
                    key={`placeholder-${user.uid}`}
                    className="remote-video-container video-off"
                  >
                    <span>{user.uid}'s video is off</span>
                  </div>
                )
            )}
          </div>
        </div>
        <div className="control-buttons">
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
          <button onClick={toggleVideo}>
            {isVideoOn ? "Turn Off Video" : "Turn On Video"}
          </button>
          <button
            onClick={isInCall ? leaveRoom : () => joinRoom(roomId, user._id)}
          >
            {isInCall ? "Leave Call" : "Join Call"}
          </button>
        </div>
      </div>
      <div className="participants">
        {remoteUsers.map((user) => (
          <div key={user.uid} className="participant">
            <span>🎤 {user.uid}</span>
          </div>
        ))}
      </div>
      <div className="folder-editor">
        <div className="file-container">
          <FileExplorer
            roomId={roomId}
            onFileSelect={(file) => {
              // console.log("Selected file:", file);
              setCurrentFile(file);
              setCode(file.content);
              setRemoteCursors({});
            }}
          />
        </div>
        <div className="editor-container">
          {currentFile && !currentFile.isFolder ? (
            <div className="coding-env">
              <div className="editor-header space-x-2">
                <button onClick={handleExecute} disabled={isExecuting}>
                  {isExecuting ? "Running..." : "Run Code"}
                </button>
                <button onClick={() => handleSave()} disabled={!currentFile}>
                  💾 Save File
                </button>
              </div>
              <Editor
                key={`${currentFile.path}-${currentFile.name}`}
                height="60vh"
                language={currentFile.language}
                value={code}
                onChange={handleFileChange}
                onMount={handleEditorMount}
              />
              {aiSuggestion && (
                <div className="ai-suggestion">
                  <h4>AI Suggestion:</h4>
                  <pre>{aiSuggestion}</pre>
                </div>
              )}
              {/* Input field */}
              <div className="input-container">
                <label>Input (stdin):</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter input for your code..."
                />
              </div>
              <div className="output-container">
                {executionResult.language && (
                  <div className="output-header">
                    {executionResult.language} {executionResult.version} Output:
                  </div>
                )}
                <pre>{executionResult.output}</pre>
              </div>
            </div>
          ) : (
            <p>Select a file to start editing</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
