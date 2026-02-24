// Listen for messages from background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMarkdown") {
    console.log("Content script received getMarkdown request");

    try {
      // Step 1: Clone the document (Readability modifies it)
      const documentClone = document.cloneNode(true);

      // Step 2: Use Readability to extract main content
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (!article) {
        console.error("Readability failed to extract article");
        return Promise.resolve({ error: "Could not extract article" });
      }

      console.log("Article extracted:", article.title);

      // Step 3: Convert HTML to Markdown using Turndown
      const turndown = new TurndownService();
      const markdown = turndown.turndown(article.content);

      // Step 4: Add title as heading
      const fullMarkdown = `# ${article.title}\n\n${markdown}`;

      console.log("Markdown generated, length:", fullMarkdown.length);

      // Return result to background script
      return Promise.resolve({
        title: article.title,
        markdown: fullMarkdown
      });
    } catch (error) {
      console.error("Error in content script:", error);
      return Promise.resolve({ error: error.message });
    }
  }
});
