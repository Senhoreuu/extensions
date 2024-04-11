let clicked = false;
const debbug = true;
let isOn = false;

const parts = {
    "ca": "Cabeça",
    "ha": "Cabelo",
    "he": "Rosto",
    "ea": "Orelhas",
    "fa": "Acessórios Faciais",
    "cc": "Corpo",
    "ch": "Peito",
    "lg": "Pernas",
    "sh": "Sapatos",
    "wa": "Cintura",
    "hd": "Mãos",
    "cp": "Capa",
    "wa": "Asas",
    "rh": "Mão Direita",
    "lh": "Mão Esquerda",
    "ey": "Olhos",
    "hr": "Cabelo 2",
    "hrb": "Cabelo Traseiro",
    "fc": "Rosto 2",
    "cj": "Jaqueta",
    "rj": "Jaqueta Direita",
    "lj": "Jaqueta Esquerda",
    "co": "Casaco",
    "rc": "Casaco Direito",
    "lc": "Casaco Esquerdo",
    "si": "Invisibilidade"
};

async function time(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

async function getHotelData(hotel) {
    const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel');

    if (!hotels) return;

    const hotelsJson = await hotels.json();

    const hotelData = hotelsJson.find(h => h.name === hotel);

    if (!hotelData) return;

    return hotelData;
}

async function getJSON(url) {
    return fetch(url).then(response => response.json()).catch(() => {
    });
}

const setLoader = (element) => {
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="loader"></div>
    `;
    div.classList.add('loader-container');
    element.before(div);
}

const removeLoader = () => {
    document.querySelector('.loader')?.remove();
};

const getHubbeLib = async () => {
    return (await getJSON('https://vercel-api-ochre.vercel.app/hotelMap')).libraries;
};

async function loadVisuals() {
    document.querySelector('#switch_opt').classList.add('disabled');

    const hotel = document.querySelector('#hotel').value;

    const visuals = document.getElementById('visuals_grid');

    visuals.innerHTML = '';

    setLoader(visuals);

    if (hotel === 'Custom') return;

    async function writeInContentArea(text) {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: (text) => {
                const contentArea = document.getElementById("data.classnames");

                if (!contentArea) return;

                if (contentArea.value.split('\n').includes(text)) return;

                if (contentArea.value.split('\n').length > 15) {
                    return;
                }

                contentArea.value += text + '\n';

                contentArea.dispatchEvent(new Event('input', {bubbles: true}));
            },
            args: [text]
        });
    }

    const hotelData = await getHotelData(hotel);

    if (!hotelData) return;

    const hubbeLib = await getHubbeLib();

    console.log(hubbeLib);

    if (!hubbeLib) return;

    const json = await getJSON(hotelData.figuremap);

    if (!json) return;

    const swf = hotelData.swf_visuais;
    const lib = json.libraries;

    const hubbeIds = hubbeLib.map(l => l.id);
    const visualsFiltered = lib.filter(vsl => !hubbeIds.find(hubbeId => hubbeId === vsl.id));

    const visualsLib = visualsFiltered.splice(0, 51);

    for await (const visual of visualsLib) {
        const div = document.createElement('div');

        div.classList.add('grid-item');

        // const url = swf + visual.id + '.swf';
        // const image64 = await getJSON(`https://vercel-api-ochre.vercel.app/extractImage/?url=${url}`);
        //<span><img src="${image64}" alt="${visual.id}"><br>(${parts[visual.parts[0].type]})</span>

        div.innerHTML = `
           <span>${visual.id}<br>(${parts[visual.parts[0].type]})</span>
        `;

        visuals.appendChild(div);

        div.addEventListener('click', async () => {
            await writeInContentArea(visual.id);
        });
    }

    if (visualsFiltered.length > 51) {
        const div = document.createElement('div');

        const totalPages = Math.ceil(visualsFiltered.length / 51);
        let currentPage = 1;

        div.classList.add('pagination');

        div.innerHTML = `
          <button class="btn" id="prev">Anterior</button>
            <span id="current-page">${currentPage}/${totalPages}</span>
          <button class="btn" id="next">Próximo</button>
        `;

        document.querySelector('#mod-add').before(div);

        const createVisuals = async (page) => {
            visuals.innerHTML = '';

            const visualsLib = visualsFiltered.slice((page - 1) * 51, page * 51);

            document.getElementById('current-page').innerText = `${page}/${totalPages}`;

            for await (const visual of visualsLib) {
                const div = document.createElement('div');

                div.classList.add('grid-item');

                div.innerHTML = `
                    <span>${visual.id}<br>(${parts[visual.parts[0].type]})</span>
                `;

                visuals.appendChild(div);

                div.addEventListener('click', async () => {
                    await writeInContentArea(visual.id);
                });
            }
        }

        document.getElementById('prev').addEventListener('click', async () => {
            if (currentPage === 1) return;

            currentPage--;

            setLoader(visuals);

            await createVisuals(currentPage);

            removeLoader();
        });

        document.getElementById('next').addEventListener('click', async () => {
            if (currentPage === totalPages) return;

            currentPage++;

            setLoader(visuals);

            await createVisuals(currentPage);

            removeLoader();
        });
    }

    removeLoader();
}

async function toggleVisuals() {
    const visuals = document.getElementById('visuals_grid');

    if (isOn) {
        visuals.classList.remove('hidden');
        await loadVisuals();
        document.querySelector('#switch_opt').classList.remove('disabled');
    } else {
        visuals.classList.add('hidden');
        removeLoader();
        document.querySelector('.pagination')?.remove();
    }
}

function toggleImport() {
    const importButton = document.getElementById('mod-add');

    if (!isOn) {
        importButton.classList.remove('hidden');
    } else {
        importButton.classList.add('hidden');
    }
}

function log(...args) {
    if (!debbug) return;

    console.log(...args);
}

async function scriptToExecute(params) {
    const {value: val, hotel, typeOfSearch, debbug} = params;

    console.log(val, hotel, typeOfSearch);

    function log(...args) {
        if (!debbug) return;

        console.log(...args);
    }

    function dispatchEvent(element, event) {
        element.dispatchEvent(new Event(event, {bubbles: true}));
    }

    function writeInContentArea(text) {
        const contentArea = document.getElementById("data.classnames");

        if (contentArea.value.split('\n').length > 15) {
            return;
        }

        contentArea.value += text + '\n';

        dispatchEvent(contentArea, 'input');
    }

    function filter(type, value, target) {
        switch (type) {
            case "asc":
                return value.startsWith(target);
            case "desc":
                return value.endsWith(target);
            case "commom":
                return value.includes(target);
        }
    }

    log('Iniciando script...');

    log('Carregando funções...');

    async function getHotelData(hotel) {
        const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel');

        if (!hotels) return;

        const hotelsJson = await hotels.json();

        const hotelData = hotelsJson.find(h => h.name === hotel);

        if (!hotelData) return;

        return hotelData;
    }

    const hotelData = await getHotelData(hotel === 'Custom' ? document.querySelector('#data.importfrom').value : hotel);

    if (!hotelData) return;

    async function getJSON(url) {
        return fetch(url).then(response => response.json()).catch(() => {
        });
    }

    const hubbeLib = (await getJSON('https://cdn.hubbe.biz/furnidatas/FigureMapJson.json')).libraries;

    async function getVisuals() {
        const json = await getJSON(hotelData.figuremap);
        const lib = json.libraries;

        if (!lib) return;

        const hubbeIds = hubbeLib.map(l => l.id);
        const ids = lib.map(l => l.id).filter(id => !hubbeIds.find(hubbeId => hubbeId === id));

        return ids.filter((id) => filter(typeOfSearch, id, val)).splice(0, 30);
    }

    log('Funções carregadas\nIniciando percurso...');

    const visuals = await getVisuals();

    await chrome.runtime.sendMessage('fetched');

    if (!visuals || !visuals.length) {
        writeInContentArea('Nenhum visual encontrado');
    }

    for (const visual of visuals) {
        writeInContentArea(visual);
    }
}

async function getMessages() {
    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const fetchButton = document.getElementById('fetch');
            const buttomMessage = document.getElementById('button-message');
            const select_hotel = document.getElementById('hotel');

            switch (request) {
                case 'fetched':
                    clicked = false;
                    buttomMessage.innerHTML = 'Fetched';
                    break;
                case 'hotelloaded':
                    clicked = false;
                    fetchButton.disabled = false;
                    select_hotel.disabled = false;
                    buttomMessage.innerHTML = 'Fetch';
                    break;
            }
        });
    } catch (error) {
        log('Erro ao receber mensagem: ', error);
    }
}

// Função principal para lidar com cliques nos radio buttons e botão Fetch
document.addEventListener('DOMContentLoaded', async function () {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    const methodClassInput = document.getElementById('input-class');
    const select_hotel = document.getElementById('hotel');
    const fetchButton = document.getElementById('fetch');
    const buttomMessage = document.getElementById('button-message');

    select_hotel.addEventListener('change', async () => {
        if (clicked) return;

        clicked = true;
        const hotel = select_hotel.value;

        fetchButton.disabled = true;
        select_hotel.disabled = true;
        buttomMessage.innerHTML = 'Loading hotel...';

        setTimeout(async () => {
            await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: async (hotel) => {
                    async function getHotelData(hotel) {
                        const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel').then(response => response.json()).catch(() => {
                        });

                        if (!hotels) return;

                        const hotelData = hotels.find(h => h.name === hotel);

                        if (!hotelData) return;

                        return hotelData;
                    }

                    function dispatchEvent(element, event) {
                        element.dispatchEvent(new Event(event));
                    }

                    // Função para setar o hotel
                    function setHotel(hotelData) {
                        const swf = document.getElementById('data.swf_link');
                        const figuredata = document.getElementById('data.figuredata_link');
                        const figuremap = document.getElementById('data.figuremap_link');

                        swf.value = hotelData.swf_visuais;
                        figuredata.value = hotelData.figuredata;
                        figuremap.value = hotelData.figuremap;

                        dispatchEvent(swf, 'input');
                        dispatchEvent(figuredata, 'input');
                        dispatchEvent(figuremap, 'input');
                    }

                    const hotelData = await getHotelData(hotel);

                    if (hotel.toLowerCase() !== "custom") {
                        setHotel(hotelData);
                    }

                    await chrome.runtime.sendMessage('hotelloaded');
                },
                args: [hotel]
            });
        }, 1000);
    });

    fetchButton.addEventListener('click', async () => {
        if (clicked) return;

        clicked = true;
        fetchButton.disabled = true;
        buttomMessage.innerHTML = 'Fetching...';

        const value = methodClassInput.value;
        const hotel = select_hotel.value;

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: scriptToExecute,
            args: [{value, hotel, nonImported: isOn, typeOfSearch: document.querySelector('#order').value, debbug}]
        });
    });
});

getMessages();

document.addEventListener('DOMContentLoaded', async function () {
    document.querySelector('#switch_opt .slider').addEventListener('click', async () => {
        isOn = !isOn;

        toggleVisuals();
        toggleImport();
    });
});