async function getAIResponse(chatInput) {
  try {
    const result = await chat.sendMessageStream(chatInput); // Send the user input to the AI
    let text = ""; // holds the response from the AI
    for await (const chunk of result.stream) {
      // Iterate over the stream of responses
      const chunkText = chunk.text(); // Get the text from the current chunk
      text += chunkText; // Append the text to the final response
    }
    //return text; // return the final response from the AI for further processing
  } catch (error) {
    // Handle any errors in sending the message to the AI
    console.error("Error sending message:", error); // Log the error to the console
    const text = "Error: unable to get a response from AI.";
    //return text; // return the error message for further processing
  }
}
