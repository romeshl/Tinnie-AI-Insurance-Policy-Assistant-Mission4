const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { chat } = require("./GoogleAI/GoogleAI");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3001;

app.get("/", (req, res) => {
  res.send("It's working!");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle chat message event
  socket.on("chat message", (msg) => {
    console.log("Message: " + msg);
      io.emit("chat message", msg);
      getAIResponse(msg);
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

async function getAIResponse(chatInput) {
  try {
    const result = await chat.sendMessageStream(chatInput);
    let text = "";
    for await (const chunk of result.stream) {
      const chunkText = await chunk.text();
      io.emit("chat message", chunkText);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    const text = "Error: unable to get a response from AI.";
    io.emit("chat message", text);
  }
}