const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "localhost:5500", // Replace with your client's URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const PORT = 3000;

// Use CORS middleware
app.use(
  cors({
    origin: "localhost:5500", // Replace with your client's URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  //res.send("This is working fine");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle chat message event
  socket.on("chat message", (msg) => {
    console.log("Message: " + msg);
    io.emit("chat message", msg); // Broadcast the message to all clients
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
