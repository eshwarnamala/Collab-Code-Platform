import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Editor from "@monaco-editor/react";
import FileExplorer from "../components/FileExplorer";
import socket from "../utils/socket"; 
import { getUserColor } from "../utils/colors";
import throttle from "lodash.throttle";
import { useVoice } from "../context/VoiceContext";
import "./RoomPage.css";

const RoomPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { joinRoom, leaveRoom, toggleMute, isMuted, isInCall, remoteUsers } =
    useVoice();
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

  // Fetch files and set current file on mount
  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch(`/api/rooms/${roomId}/files`);
      const data = await response.json();

      const path = searchParams.get("path") || "/";
      const file = searchParams.get("file");

      if (file) {
        const selectedFile = data.find(
          (f) => f.name === file && f.path === path
        );
        if (selectedFile) {
          setCurrentFile(selectedFile);
          setCode(selectedFile.content); // Initialize editor content
          // editorRef.current = null; // Reset editor ref
        }
      }
    };
    fetchFiles();
  }, [roomId, searchParams]);

  // Join voice chat when entering the room
  useEffect(() => {
    if (user?._id) {
      joinRoom(roomId, user._id);
    }
    return () => {
      leaveRoom();
    };
  }, [user, roomId]);

  // Listen for cursor updates from others
  useEffect(() => {
    const handleCursorUpdate = ({ cursor, userId, username }) => {
      console.log("Remote cursor update:", userId, cursor); 
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { ...cursor, username, color: getUserColor(userId) }, // Overwrite old position
      }));
    };

    socket.on("cursor-update", handleCursorUpdate);
    return () => socket.off("cursor-update", handleCursorUpdate);
  }, []);

  // Handle local cursor changes
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    // console.log("Editor mounted");
    console.log("Editor mounted for file:", currentFile.name); 
    const throttledEmitCursor = throttle((cursor) => {
      socket.emit("cursor-position", {
        roomId,
        cursor,
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
          const response = await fetch("/api/ai/suggest", {
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
          setAiSuggestion(data.suggestion.replace(/\r\n/g, '\n'));
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
      throttledEmitCursor(cursor);
    });
  };

  // Join room and set up Socket.io listeners
  useEffect(() => {
    socket.emit("join-room", roomId);

    // Listen for code updates from other users
    socket.on("code-update", ({ code, filePath }) => {
      if (currentFile?.path === filePath) {
        setCode(code); 
      }
    });

    return () => {
      socket.off("code-update");
    };
  }, [roomId, currentFile]);



  // Replace the decorations useEffect with model markers
  useEffect(() => {
    if (!editorRef.current) return;

    // Clear existing decorations first
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

    // Apply new decorations and store their IDs
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


  // Handle code changes in the editor
  const handleFileChange = async (value) => {
    if (!currentFile) return;
    // Update local state
    setCode(value);
    // Broadcast changes to other users in the room
    socket.emit("code-change", {
      roomId,
      code: value,
      // code: code,
      filePath: currentFile.path,
    });

    // Save the file to the backend
    try {
      const response = await fetch(`/api/rooms/${roomId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: currentFile.name,
          content: value,
          // content: code,
          path: currentFile.path,
        }),
      });

      const data = await response.json();
      console.log("Backend response:", data); 

      if (!response.ok) {
        throw new Error(data.error || "Failed to save file");
      }
    } catch (err) {
      console.error("Error saving file:", err);
    }
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
    setExecutionResult({ output: "", language: "", version: "" }); // Reset state

    try {
      const response = await fetch(`/api/rooms/${roomId}/execute`, {
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
  return (
    <div className="room-page">
      <h1>{`Room #${roomId}`}</h1>
      <p>Welcome, {user.username}!</p>
      <div className="voice-controls">
        <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
        <button
          onClick={isInCall ? leaveRoom : () => joinRoom(roomId, user._id)}
        >
          {isInCall ? "Leave Call" : "Join Call"}
        </button>
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
              console.log("Selected file:", file); 
              setCurrentFile(file);
              setCode(file.content); 
            }}
          />
        </div>
        <div className="editor-container">
          {currentFile && !currentFile.isFolder ? (
            <div className="coding-env">
              <div className="editor-header">
                <button onClick={handleExecute} disabled={isExecuting}>
                  {isExecuting ? "Running..." : "Run Code"}
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

