import express from "express";
import Room from "../models/Room.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { name, password } = req.body;

    
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }


    if (!name || !password) {
      return res
        .status(400)
        .json({ error: "Room name and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    const room = new Room({
      roomId: uuidv4(),
      name,
      password: hashedPassword,
      createdBy: req.user._id,
      members: [{ user: req.user._id }],
    });

    await room.save();
    res.status(201).json({ roomId: room.roomId }); 
  } catch (err) {
    console.error("Room creation error:", err); 
    res.status(500).json({ error: "Room creation failed" });
  }
});


router.post("/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    
    const isValid = await bcrypt.compare(password, room.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    
    const isMember = room.members.some((member) =>
      member.user.equals(req.user._id)
    );
    if (!isMember) {
      room.members.push({ user: req.user._id }); 
      await room.save();
    }

    res.json({ success: true, roomId: room.roomId });
  } catch (err) {
    console.error("Room join error:", err);
    res.status(500).json({ error: "Failed to join room" });
  }
});


router.get("/active", async (req, res) => {
  try {
    const rooms = await Room.find({ "members.user": req.user._id })
      .populate("createdBy", "displayName") 
      .sort({ createdAt: -1 }); 

    res.json(rooms);
  } catch (err) {
    console.error("Failed to fetch active rooms:", err);
    res.status(500).json({ error: "Failed to fetch active rooms" });
  }
});


router.post("/:roomId/files", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, content, path, isFolder } = req.body;

    
    if (!name || !path) {
      return res.status(400).json({ error: "Name and path are required" });
    }

    
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    
    const normalizePath = (path) => path.replace(/\/+$/, "");

    
    const existingFile = room.files.find(
      (file) =>
        file.name === name && normalizePath(file.path) === normalizePath(path)
    );

    if (existingFile) {
      
      existingFile.content = content;
      await room.save();
      return res.json({ success: true });
    } else {
      
      const duplicate = room.files.find(
        (file) =>
          file.name === name && normalizePath(file.path) === normalizePath(path)
      );
      if (duplicate) {
        return res.status(400).json({ error: "File/folder already exists" });
      }

      
      let language = "plaintext";
      if (!isFolder) {
        const extension = name.split(".").pop();
        const languageMap = {
          js: "node",
          py: "python",
          java: "java",
          cpp: "cpp",
          html: "html",
          css: "css",
          json: "json",
          md: "markdown",
        };
        language = languageMap[extension] || "plaintext";
      }

      
      room.files.push({
        name,
        content: isFolder ? "" : content,
        language,
        isFolder,
        path,
      });

      await room.save();
      return res.json({ success: true });
    }
  } catch (err) {
    console.error("File operation error:", err);
    res.status(500).json({ error: "Failed to process file" });
  }
});


router.get("/:roomId/files", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const files = room.files.map((file) => ({
      //   _id: file._id, 
      name: file.name,
      content: file.content,
      language: file.language,
      isFolder: file.isFolder,
      path: file.path,
      createdAt: file.createdAt,
    }));
    res.json(room.files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});


router.post("/:roomId/execute", async (req, res) => {
  console.log("Execution request received:", req.body.timestamp);
  try {
    const { code, language, input } = req.body;

   
    const languageMap = {
      python: { name: "python", version: "3.10.0", displayName: "Python" },
      node: {
        name: "node",
        version: "18.15.0",
        displayName: "JavaScript",
      },
      cpp: { name: "cpp", version: "10.2.0", displayName: "C++" },
      java: { name: "java", version: "15.0.2", displayName: "Java" },
    };

    const langConfig = languageMap[language];
    if (!langConfig) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: langConfig.name,
        version: langConfig.version,
        files: [{ content: code }],
        stdin: input || "", 
      }
    );

    res.json({
      output: response.data.run.output,
      language: langConfig.displayName,
      version: langConfig.version,
    });
  } catch (err) {
    res.status(500).json({ error: "Execution failed" });
  }
});

export default router;
