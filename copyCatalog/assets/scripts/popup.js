(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            const main_class = "d-flex overflow-hidden position-relative cursor-pointer gap-1 align-items-center justify-content-center layout-grid-item border border-2 border-muted rounded active";

            function updateCatalog() {
                const classes = `.${main_class.split(' ').join('.')}`;
                const selectors = document.querySelectorAll(classes);
                const selector = selectors[selectors.length - 1];

                if (!selector) return;

                const catalog = selector.lastChild.textContent;

                chrome.runtime.sendMessage({ action: 'updateCatalog', catalog });
            }

            updateCatalog();
        }
    });
})();

async function copyToClipboard() {
    const button = document.getElementById('copy');
    button.textContent = 'Copying...';
    button.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: async () => {
                const selector = document.querySelector('div[style="--bs-columns: 5; --nitro-grid-column-min-height: 40px; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));"]');

                if (!selector) return;
    
                const items = selector.querySelectorAll('div');
    
                const catalogItems = Array.from(items).map((item) => {
                    const image = item.style.backgroundImage.replace('url("', '').replace('")', '');
    
                    const imageParts = image.split('/');
                    return imageParts[imageParts.length - 1].replace('.png', '').replace('_icon', '');
                });

                chrome.runtime.sendMessage({ action: 'copy', catalog: catalogItems.join('\n')});
            }
        });
    });
}

function updateCatalog(catalog) {
    document.getElementById('catalog').textContent = catalog;
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateCatalog') {
        updateCatalog(message.catalog);
    }
    else if (message.action === 'copy') {
        const button = document.getElementById('copy');

        navigator.clipboard.writeText(message.catalog).then(() => {
            button.textContent = 'Copied!';
        });
    }
});

document.getElementById('copy').addEventListener('click', copyToClipboard);

document.getElementById('downloadIcon').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            function downloadImage(url, filename) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'blob';
            
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        // Cria um novo objeto Blob com a resposta
                        var blob = new Blob([xhr.response], { type: 'application/octet-stream' });
                        var link = document.createElement('a');
                        link.href = window.URL.createObjectURL(blob);
                        link.download = filename;
                        link.click();
                    }
                };
            
                xhr.send();
            }
            
            (async () => {
                document.body.addEventListener('click', async (e) => {
                    const target = e.target;
            
                    if (target.tagName.toLowerCase() === 'div') {
                        const offsetParent = target.offsetParent;
            
                        if (!offsetParent) return;
            
                        const img = offsetParent.querySelector('img');
            
                        if (!img) return;
            
                        const src = img.src;
            
                        downloadImage(src, src.split('/').pop());
                    }
                });
            })();
        }
    });

    document.getElementById('downloadIcon').textContent = 'Actived!';
    document.getElementById('downloadIcon').disabled = true;
});