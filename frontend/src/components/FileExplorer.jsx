import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "./FileExplorer.css";
import { useSearchParams } from "react-router-dom";

const FileExplorer = ({ roomId, onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [newName, setNewName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  //   const [currentPath, setCurrentPath] = useState("/");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPath, setCurrentPath] = useState(
    searchParams.get("path") || "/" // Initialize from URL
  );
  const [selectedFile, setSelectedFile] = useState(
    searchParams.get("file") || null
  );

  // Update URL when currentPath or selectedFile changes
  useEffect(() => {
    const params = {};
    if (currentPath) params.path = currentPath;
    if (selectedFile) params.file = selectedFile;
    setSearchParams(params);
  }, [currentPath, selectedFile]);

  /// Handle file selection
  const handleFileClick = (file) => {
    if (file.isFolder) {
      setCurrentPath(`${currentPath}${file.name}/`);
      setSelectedFile(null); // Clear selected file when navigating to a folder
    } else {
      setSelectedFile(file.name);
      onFileSelect(file); // Pass the file to the parent component
    }
  };

  // Fetch files for the current path
  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch(`/api/rooms/${roomId}/files`);
      const data = await response.json();
      const filteredFiles = data.filter((file) => file.path === currentPath);
      setFiles(filteredFiles);
    };
    fetchFiles();
  }, [roomId, currentPath]);

  const fetchFiles = async () => {
    const response = await fetch(`/api/rooms/${roomId}/files`);
    const data = await response.json();
    const filteredFiles = data.filter((file) => file.path === currentPath);
    setFiles(filteredFiles);
  };

  //   Create file/folder
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName) return;

    // Add credentials: "include" to send cookies
    await fetch(`/api/rooms/${roomId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // <-- Add this line
      body: JSON.stringify({
        name: newName,
        content: "",
        path: currentPath,
        isFolder: isCreatingFolder,
      }),
    });
    await fetchFiles();
    setNewName("");
    setIsCreatingFolder(false);
  };

  // Handle breadcrumb clicks
  const handleBreadcrumbClick = (index) => {
    const newPath =
      currentPath
        .split("/")
        .slice(0, index + 1)
        .join("/") + "/";
    setCurrentPath(newPath);
  };

  return (
    <div className="file-explorer">
      <div className="breadcrumbs">
        {currentPath.split("/").map((dir, index) => (
          <span
            key={uuidv4()}
            onClick={() => handleBreadcrumbClick(index)}
            style={{ cursor: "pointer" }}
          >
            {dir}
            {index !== currentPath.split("/").length - 1 && " > "}
          </span>
        ))}
      </div>

      {/* File/Folder List */}
      <div className="file-list">
        {files.map((file) => (
          <div
            key={file.name}
            className={`file-item ${file.isFolder ? "folder" : "file"} ${
              selectedFile === file.name ? "selected" : ""
            }`}
            onClick={() => handleFileClick(file)}
          >
            {file.isFolder ? "📁" : "📄"} {file.name}
          </div>
        ))}
      </div>

      {/* Create New File/Folder */}
      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          placeholder={
            isCreatingFolder ? "Folder name" : "File name (e.g., app.js)"
          }
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={isCreatingFolder}
            onChange={(e) => setIsCreatingFolder(e.target.checked)}
          />
          Create Folder
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default FileExplorer;
