<script lang="ts">
	import { chat } from '$lib/index';
	import { tick } from 'svelte';

	let userInputRef: HTMLInputElement | null = null;
	let messagesDisplayRef: HTMLDivElement | null = null;

	interface Message {
		text: String;
		user: boolean;
	}

	let messages: Message[] = [];
	let userInput: string = '';
	let loading: boolean = false;
	let startInterview: boolean = false;

    function scrollToBottom() {
        if (messagesDisplayRef) {
            messagesDisplayRef.scrollBy(0, messagesDisplayRef.scrollHeight-messagesDisplayRef.clientHeight);
        }
    }

	// Begin the interview process
	const beginInterview = async () => {
		messages = []; // Clear the messages list
		startInterview = true; // Set the interview to started
		loading = true; // show the loading animation
        const jobTitle = 'start'; // Set the job title for the interview
		const AIResponse = await getAIResponse(jobTitle); // Get the AI response for the job title
		if (userInputRef) {
			userInputRef.focus();
		}
		loading = false; // hide the loading animation
		handleAIErrors(AIResponse); // Handle any errors in the AI response
	};

	// Handle sending user messages and receiving AI responses
	const handleSendMessage = async () => {
		if (!userInput.trim()) {
			// exit the function if user input is empty
			return;
		}
		messages = [...messages, { text: userInput, user: true }];
        await tick();
        scrollToBottom();
		loading = true; // Show the loading animation
		const AIResponse = await getAIResponse(userInput); // Get the AI response for the user input
		userInput = '';
		loading = false; // Hide the loading animation
		handleAIErrors(AIResponse); // Handle any errors in the AI response
	};

	// Function to get AI response for a given input
	async function getAIResponse(chatInput: string): Promise<string> {
		try {
			const result = await chat.sendMessageStream(chatInput); // Send the user input to the AI
			let text: string = ''; // holds the response from the AI
            let firstTime = true;
			for await (const chunk of result.stream) {
				// Iterate over the stream of responses
				const chunkText = chunk.text(); // Get the text from the current chunk
				text += chunkText; // Append the text to the final response
                if (firstTime) {
                    firstTime = false;
                    messages = [...messages, { text: chunkText, user: false }];
                    await tick();
                    scrollToBottom();
                } else {
                    messages = [...messages.slice(0, messages.length - 1), { text: text, user: false }];
                }
			}
            await tick();
            scrollToBottom();
			return text; // return the final response from the AI for further processing
		} catch (error) {
			// Handle any errors in sending the message to the AI
			console.error('Error sending message:', error); // Log the error to the console
			const text = 'Error: unable to get a response from AI.';
			messages = [...messages, { text: text, user: false }]; // Add the error message to the messages list
			return text; // return the error message for further processing
		}
	}

	// Handle specific AI error messages
	function handleAIErrors(error: string) {
		if (
			error.toLocaleLowerCase().includes('Thank you!!!'.toLocaleLowerCase()) || // Check if the error message contains the ending message
			error.toLocaleLowerCase().includes('Error'.toLocaleLowerCase()) // Check if the error message contains the error message
		) {
			startInterview = false; // End the interview
		}
	}
</script>

<div class="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-blue-900">
	<h1 class="mb-5 font-bold text-[1.8rem] text-blue-50 text-center [text-shadow:_3px_3px_0_rgb(0_0_0_/_20%)] max-w-lg ">
		Tinnie - AI insurance policy assistant
	</h1>

	<div class="bg-white w-full max-w-lg rounded-lg overflow-hidden shadow-gray-700 shadow-lg">
		<div bind:this={messagesDisplayRef} class="mt-1 p-4 h-96 overflow-y-scroll">
			{#each messages as message, index}
				<div class={`flex ${message.user ? 'justify-end' : 'justify-start'} mb-2`}>
					<div class={`rounded-lg p-2 shadow-md overflow-x-hidden flex flex-wrap ${message.user ? ' bg-blue-500 text-white' : 'bg-gray-200'}`}>
						<p>{message.text.toString()}</p>
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
