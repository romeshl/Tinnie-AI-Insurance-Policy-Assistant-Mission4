<script lang="ts">
	import { onDestroy } from 'svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { io, Socket } from 'socket.io-client';

	let userInputRef: HTMLInputElement | null = null; // Reference to the user input element
	let messagesDisplayRef: HTMLDivElement | null = null; // Reference to the messages display div

	interface Message {
		// Define the message interface
		text: string;
		user: boolean;
	}

	let socket: Socket; // Define the socket variable

	let messages: Message[] = []; // Holds user and AI responses
	let userInput: string = ''; // Holds the user input
	let loading: boolean = false; // Show the loading animation
	let startInterview: boolean = false; // Starts and ends the interview
	let startButtonDisabled: boolean = true; // Enable the start button

	let firstTime: boolean = true; // Check if it's the first response from the web socket stream
	let text: string = ''; // holds the text from the web socket stream

	socket = io('http://localhost:3000', {
		// Connect to the backend server
		query: {
			password: import.meta.env.VITE_WEB_SOCKET_PASSWORD // Pass the password to the server
		},
		reconnection: true, // Enable reconnection (this is true by default)
		reconnectionAttempts: 2, // Set the maximum number of reconnection attempts
		reconnectionDelay: 1000, // The initial delay before attempting to reconnect (in milliseconds)
		reconnectionDelayMax: 5000 // The maximum delay between reconnection attempts (in milliseconds)
	});

	socket.on('connect', () => {
		startButtonDisabled = false; // Enable the start button once connected to the server
		messages = []; // Clear the messages list
	});

	socket.on('connect_error', (error) => { // this one gets called when the backend server is not running
		console.error('Connection Error:', error.message);
		startButtonDisabled = true; // Disable the start button
		messages = [ // displays the error message to the user
			...messages,
			{ text: 'Connection Error: Unable to Connect to the Generative AI Server.', user: false }
		];
	});

	onDestroy(() => {
		// Close the socket connection when the component is destroyed
		socket.disconnect();
	});

	socket.on('chat message', (msg: string) => {
		// Listen for chat messages from the backend server
		text += msg; // Append the text to the final response
		if (firstTime) {
			// Check if it's the first response, if so add a new message to the list with the first chunk of text
			firstTime = false;
			messages = [...messages, { text: msg, user: false }];
		} else {
			// If it's not the first response, update the last message in the list with the 'text' updated with  new chunk of text
			messages = [...messages.slice(0, messages.length - 1), { text: text, user: false }];
		}
		scrollToBottom(); // Scroll to the bottom of the messages display
	});

	socket.on('end message', (msg: string) => {
		// Listen for the end message from the backend server
		text = ''; // Reset the text
		firstTime = true; // Reset the firstTime variable
		if (userInputRef) {
			// Focus on the user input element
			userInputRef.focus();
		}
		loading = false; // Hide the loading animation
		scrollToBottom(); // Scroll to the bottom of the messages display
		handleAIErrors(messages[messages.length - 1 || 0].text); // Handle specific AI error messages
	});

	function scrollToBottom() {
		// Scroll to the bottom of the messages display
		if (messagesDisplayRef) {
			messagesDisplayRef.scrollBy(
				0,
				messagesDisplayRef.scrollHeight - messagesDisplayRef.clientHeight
			);
		}
	}

	// Begin the interview process
	const beginInterview = () => {
		messages = []; // Clear the messages list
		startInterview = true; // Set the interview to started
		loading = true; // Show the loading animation
		socket.emit('chat message', 'start'); // Send the start message to the backend server
	};

	// Handle sending user messages and receiving AI responses
	const handleSendMessage = () => {
		if (!userInput.trim()) {
			// Check if the user input is empty
			return;
		}
		messages = [...messages, { text: userInput, user: true }]; // Add the user message to the messages list
		scrollToBottom(); // Scroll to the bottom of the messages display
		loading = true; // Show the loading animation
		socket.emit('chat message', userInput); // Send the user message to the backend server
		userInput = ''; // Clear the user input
	};

	// Handle specific AI error messages
	function handleAIErrors(error: string) {
		// Use lowercase 'string'
		if (
			error.toLocaleLowerCase().includes('thank you!!!') || // Check if the error message contains the ending message
			error.toLocaleLowerCase().includes('error')
		) {
			startInterview = false; // End the interview
		}
	}
</script>

<div
	class="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-blue-900"
>
	<h1
		class="mb-5 font-bold text-[1.8rem] text-blue-50 text-center [text-shadow:_3px_3px_0_rgb(0_0_0_/_20%)] max-w-lg"
	>
		Tinnie - AI Insurance Policy Assistant
	</h1>

	<div class="bg-white w-full max-w-lg rounded-lg overflow-hidden shadow-gray-700 shadow-lg">
		<div bind:this={messagesDisplayRef} class="mt-1 p-4 h-96 overflow-y-scroll">
			{#each messages as message, index}
				<div class={`flex ${message.user ? 'justify-end' : 'justify-start'} mb-2`}>
					<div
						class={`rounded-lg p-2 shadow-md overflow-x-hidden flex flex-wrap ${message.user ? ' bg-blue-500 text-white' : 'bg-gray-200'}`}
					>
						<SvelteMarkdown source={message.text.toString()} />
					</div>
				</div>
			{/each}
			{#if loading}
				<div class="loader"></div>
			{/if}
		</div>
		{#if !startInterview}
			<div class="flex justify-center p-4 border-t border-gray-200 bg-blue-50">
				<button
					class="p-2 border border-blue-500 w-[200px] rounded-lg bg-blue-500 text-white font-bold shadow-sm shadow-gray-700
					 active:bg-blue-300 active:border-blue-300 active:shadow-gray-100 active:shadow-md active:text-blue-700
					  hover:bg-blue-700"
					disabled={startButtonDisabled}
					on:click={beginInterview}
				>
					Start
				</button>
			</div>
		{:else}
			<div class="bg-blue-50 p-4 border-t border-gray-200 flex">
				<input
					type="text"
					class="flex-1 p-2 border border-gray-300 rounded-lg outline-none"
					placeholder="Type your message..."
					bind:value={userInput}
					readOnly={loading}
					bind:this={userInputRef}
					on:keydown={(e) => e.key === 'Enter' && handleSendMessage()}
				/>
				<button
					class="ml-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all"
					on:click={handleSendMessage}
				>
					Send
				</button>
			</div>
		{/if}
	</div>
</div>
