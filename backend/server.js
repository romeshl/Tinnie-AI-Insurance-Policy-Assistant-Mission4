const express = require("express"); // Import express
const http = require("http"); // Import http
const { Server } = require("socket.io"); // Import socket.io

const { chat } = require("./GoogleAI/GoogleAI"); // Import GoogleAI chat

const app = express(); // Create express app
const server = http.createServer(app); // Create http server
const io = new Server(server); // Create socket.io server

const PORT = 3000; // Port number of the Server

app.get("/", (req, res) => { // Root route
  res.send("<h1>Welcome to Tinnie - AI Insurance Policy Assistant server!</h1>");
});

server.listen(PORT, () => { // Server listening on PORT
  console.log(`Server running on port ${PORT}`);
});

io.use((socket, next) => { // Socket.io authentication middleware
  const password = socket.handshake.query.password; // Get password from query
  if (password === process.env.WEB_SOCKET_PASSWORD) {
    next(); // Allow connection
  } else {
    next(new Error("Unauthorized")); // Deny connection
  }
});

io.on("connection", (socket) => { // Socket.io connection is established
  console.log("A user connected");
  socket.on("chat message", (msg) => { 
    getAIResponse(msg); // Grabs the message from the client and sends it to the AI
  });
  socket.on("disconnect", () => { // When the user disconnects
    console.log("User disconnected");
  });
});

async function getAIResponse(chatInput) { // Function to get AI response
  try {
    const result = await chat.sendMessageStream(chatInput); // Send message to AI
    for await (const chunk of result.stream) { // Get response from AI stream
      const chunkText = await chunk.text(); // Get text from chunk
      io.emit("chat message", chunkText); // Send response to client
    }
  } catch (error) {
    console.error("Error sending message:", error); // Log error
    const text = "Error: unable to get a response from AI."; // Error message
    io.emit("chat message", text); // Send error message to client
  } finally {
    io.emit("end message", "end"); // Send end message to client
  }
}
