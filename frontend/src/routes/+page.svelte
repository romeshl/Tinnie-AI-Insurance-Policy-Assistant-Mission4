<script lang="ts">
	import { tick, onDestroy } from 'svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { io, Socket } from 'socket.io-client';

	let userInputRef: HTMLInputElement | null = null;
	let messagesDisplayRef: HTMLDivElement | null = null;

	interface Message {
		text: string; // Use lowercase 'string'
		user: boolean;
	}

	let socket: Socket;
	
	let messages: Message[] = [];
	let userInput: string = '';
	let loading: boolean = false;
	let startInterview: boolean = false;
	let firstTime: boolean = true;
	let text: string = '';

	socket = io('http://localhost:3001'); // Replace with your server URL

	onDestroy(() => {
		socket.disconnect();
	});

	// Listen for incoming messages
	socket.on('chat message', (msg: string) => {
		text += msg; // Append the text to the final response
		if (firstTime) {
			firstTime = false;
			messages = [...messages, { text: msg, user: false }];
		} else {
			messages = [...messages.slice(0, messages.length - 1), { text: text, user: false }];
		}
		scrollToBottom();
	});

	socket.on('end message', (msg: string) => {
		text = '';
		firstTime = true;
		//const AIResponse = messages[messages.length - 1 || 0]; // Get the AI response for the job title
		if (userInputRef) {
			userInputRef.focus();
		}
		loading = false; // Hide the loading animation
		scrollToBottom();
		handleAIErrors(messages[messages.length - 1 || 0].text); // Handle specific AI error messages
	});

	function scrollToBottom() {
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
		socket.emit('chat message', 'start');
	};

	// Handle sending user messages and receiving AI responses
	const handleSendMessage = () => {
		if (!userInput.trim()) {
			return;
		}
		messages = [...messages, { text: userInput, user: true }];
		scrollToBottom();
		loading = true; // Show the loading animation
		socket.emit('chat message', userInput);

		userInput = '';
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
		Tinnie - AI insurance policy assistant
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
					Enter
				</button>
			</div>
		{/if}
	</div>
</div>
