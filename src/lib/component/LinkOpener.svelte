<script>
    let linkUrl = "";

    function openLink() {
        if (linkUrl.trim()) {
            // Ensure the URL starts with http:// or https://
            const formattedUrl =
                linkUrl.startsWith("http://") || linkUrl.startsWith("https://")
                    ? linkUrl
                    : `https://${linkUrl}`;

            try {
                chrome.tabs.create(
                    {
                        url: formattedUrl,
                        active: true,
                    },
                    (tab) => {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ["content-script.js"],
                        });
                    },
                );
            } catch (error) {
                window.open(formattedUrl, "_blank");
            }
        }
    }
</script>

<div class="link-opener">
    <input type="text" bind:value={linkUrl} placeholder="Enter URL to open" />
    <button on:click={openLink}>Open Link</button>
</div>

<style>
    .link-opener {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    input {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    button {
        padding: 8px 16px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    button:hover {
        background-color: #45a049;
    }
</style>
