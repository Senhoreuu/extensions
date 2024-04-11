let clicked = false;
const debbug = false;
let isOn = false;

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

function save_options() {
    const importCustom = document.getElementById('import-custom').checked;
    const ignoreExist = document.getElementById('ignore-exist').checked;
    const onlyOneFurni = document.getElementById('only-one').checked;
    const order = document.getElementById('order').value;
    const method = document.getElementById('method-class').checked ? 'class' : 'name';
    const class_value = document.getElementById('input-class').value;
    const name_value = document.getElementById('input-name').value;
    const hotel = document.getElementById('hotel').value;

    const config = { importCustom, ignoreExist, onlyOneFurni, order, method, class_value, name_value, hotel };

    localStorage.setItem('config', JSON.stringify(config));
}

function restore_options() {
    const config = JSON.parse(localStorage.getItem('config'));

    if (!config) return;

    const { importCustom, ignoreExist, onlyOneFurni, order, method, class_value, name_value } = config;

    document.getElementById('import-custom').checked = importCustom;
    document.getElementById('ignore-exist').checked = ignoreExist;
    document.getElementById('only-one').checked = onlyOneFurni;
    document.getElementById('order').value = order;
    document.getElementById('method-class').checked = method === 'class';
    document.getElementById('method-name').checked = method === 'name';
    document.getElementById('input-class').value = class_value;
    document.getElementById('input-name').value = name_value;

    const methodClassInput = document.getElementById('input-class');
    const methodNameInput = document.getElementById('input-name');
    const onlyOne = document.getElementById('only-one');
    const onlyOneSpan = document.getElementById('span-only-one');

    if (method === 'class') {
        methodClassInput.style.display = 'block';
        methodNameInput.style.display = 'none';
        onlyOne.style.display = 'none';
        onlyOneSpan.style.display = 'none';
    }
    else {
        methodNameInput.style.display = 'block';
        onlyOne.style.display = 'flex';
        onlyOneSpan.style.display = 'flex';
        methodClassInput.style.display = 'none';
    }

    const fetchButton = document.getElementById('fetch');

    fetchButton.disabled = method === 'class' ? methodClassInput.value.length === 0 : methodNameInput.value.length === 0;

    const buttomMessage = document.getElementById('button-message');

    buttomMessage.innerHTML = 'Fetch';
}

function log(...args) {
    if (!debbug) return;

    console.log(...args);
}

async function scriptToExecute(params, config) {
    const { method, value, hotel } = params;
    const { importCustom, ignoreExist, debbug, onlyOneFurni, order } = config;

    if (hotel.toLowerCase() === 'habbo br') {
        const habbobr = document.getElementById('data.habbooficial')
        habbobr.click();
    }

    function log(...args) {
        if (!debbug) return;

        console.log(...args);
    }

    log('Iniciando script...');

    log('Carregando funções...');

    async function getHotelData(hotel) {
        const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel');

        if (!hotels.ok) return;

        const hotelsJson = await hotels.json();

        const hotelData = hotelsJson.find(h => h.name === hotel);

        if (!hotelData) return;

        return hotelData;
    }

    const hotelData = await getHotelData(hotel);

    // Função para setar o hotel
    function setHotel(hotelData) {
        const swf = document.getElementById('data.swf_link');
        const furnidata = document.getElementById('data.furnidata');
        const icon = document.getElementById('data.swf_link_icons');

        swf.value = hotelData.swf;
        furnidata.value = hotelData.furnidata;
        icon.value = hotelData.icon;

        function dispatchEvent(element, eventName) {
            const event = new Event(eventName);
            element.dispatchEvent(event);
        }

        dispatchEvent(swf, 'input');
        dispatchEvent(furnidata, 'input');
        dispatchEvent(icon, 'input');
    }

    async function getClassNames(swf_name) {
        log(`Buscando furnis com o nome: ${swf_name}`);

        const toFetch = hotel.toLowerCase() === 'custom' ? document.getElementById('data.furnidata').value : hotelData.src;

        const response_hotel = await fetch(toFetch);
        const response_furniture = await fetch('https://cdn.hubbe.biz/furnidatas/FurnitureData.json');

        if (!response_hotel.ok || !response_furniture.ok) {
            log('Erro ao fazer requisições');
            return;
        }

        log('Fazendo requisições...');

        const data = await response_hotel.json();
        const data_furnidata = await response_furniture.json();

        log('Requisições feitas\nFiltrando...');

        const filtereds = [];

        if (onlyOneFurni && method !== 'class') {
            const furni = data.roomitemtypes.furnitype.find(element => {
                if (order === 'asc') {
                    if (!importCustom && element.classname.startsWith('cstm_')) return false;

                    if (!element.classname.startsWith(swf_name)) return false;
                }
                else if (order === 'desc') {
                    if (!importCustom && element.classname.endsWith('cstm_')) return false;

                    if (!element.classname.endsWith(swf_name)) return false;
                }
                else {
                    if (!importCustom && element.classname.includes('cstm_')) return false;

                    if (!element.classname.split('_').some(n => n.includes(swf_name))) return false;
                }

                if (!ignoreExist && data_furnidata.roomitemtypes.furnitype.find(e => e.classname === element.classname)) return false;

                return element;
            });

            if (furni) filtereds.push(furni.classname);
        }
        else {
            data.roomitemtypes.furnitype.forEach(element => {
                if (order === 'asc') {
                    if (!importCustom && element.classname.startsWith('cstm_')) return false;

                    if (!element.classname.startsWith(swf_name)) return false;
                }
                else if (order === 'desc') {
                    if (!importCustom && element.classname.endsWith('cstm_')) return false;

                    if (!element.classname.endsWith(swf_name)) return false;
                }
                else {
                    if (!importCustom && element.classname.includes('cstm_')) return false;

                    if (!element.classname.split('_').some(n => n.includes(swf_name))) return false;
                }

                if (!ignoreExist && data_furnidata.roomitemtypes.furnitype.find(e => e.classname === element.classname)) return;

                filtereds.push(element.classname);
            });
        }

        log('Filtragem feita\nInserindo na área de texto...');

        const areatext = document.getElementById('data.classnames');

        if (!areatext) {
            log('Erro ao encontrar área de texto');
            return;
        }

        const inputEvent = new Event('input', { bubbles: true });

        if (filtereds.length) {
            if (areatext.value.length > 0) {
                const furnisInArea = areatext.value.split('\n');

                filtereds.forEach((element, index) => {
                    if (furnisInArea.includes(element)) {
                        filtereds.splice(index, 1);
                    }
                });

                areatext.value += '\n';
            }

            log(`Extraídos: ${filtereds.length} furnis`);

            areatext.value += filtereds.join('\n');
        }
        else {
            if (areatext.value.length > 0) {
                areatext.value += '\n';
            }

            areatext.value += 'Nenhum furni encontrado';
        }

        areatext.dispatchEvent(inputEvent);
    }

    async function getCollectionByFirst(furni_name) {
        const response_hotel = await fetch(hotelData.src);

        let data = await response_hotel.json();

        const furni = data.roomitemtypes.furnitype.find(element => {
            return element.classname.startsWith(furni_name);
        });

        if (!furni) return;

        data = null;

        await getClassNames(furni.classname);
    }

    log('Funções carregadas\nIniciando percurso...');

    if (hotel.toLowerCase() !== "custom") {
        setHotel(hotelData);
    }

    method === 'class' ? await getClassNames(value) : await getCollectionByFirst(value);

    await chrome.runtime.sendMessage('fetched', () => {
        log('Mensagem enviada');
    });
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
    }
    catch (error) {
        log('Erro ao receber mensagem: ', error);
    }
}

// Função principal para lidar com cliques nos radio buttons e botão Fetch
document.addEventListener('DOMContentLoaded', async function () {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const methodClass = document.getElementById('method-class');
    const methodClassInput = document.getElementById('input-class');
    const methodName = document.getElementById('method-name');
    const methodNameInput = document.getElementById('input-name');
    const onlyOne = document.getElementById('only-one');
    const onlyOneSpan = document.getElementById('span-only-one');
    const fetchButton = document.getElementById('fetch');
    const buttomMessage = document.getElementById('button-message');
    const select_hotel = document.getElementById('hotel');
    const deleteButton = document.getElementById('delete-all');

    deleteButton.addEventListener('click', () => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: async () => {
                const elementsToClean = [
                    document.getElementById('data.classnames'),
                    document.getElementById('data.swf_link'),
                    document.getElementById('data.furnidata')
                ];

                elementsToClean.forEach(element => {
                    if (!element) return;

                    const event = new Event('input', { bubbles: true });

                    element.value = '';

                    element.dispatchEvent(event);
                });
            }
        });
    });
    methodClass.addEventListener('click', () => {
        if (clicked) return;
        save_options();

        methodClassInput.style.display = 'block';
        methodNameInput.style.display = 'none';
        onlyOne.style.display = 'none';
        onlyOneSpan.style.display = 'none';
    });

    methodName.addEventListener('click', () => {
        if (clicked) return;
        save_options();

        methodNameInput.style.display = 'block';
        onlyOne.style.display = 'flex';
        onlyOneSpan.style.display = 'flex';
        methodClassInput.style.display = 'none';
    });

    methodClassInput.addEventListener('input', async () => {
        if (clicked) return;
        save_options();

        buttomMessage.innerHTML = 'Fetch';
        fetchButton.disabled = methodClassInput.value.length === 0;
    });

    methodNameInput.addEventListener('input', async () => {
        if (clicked) return;
        save_options();

        buttomMessage.innerHTML = 'Fetch';
        fetchButton.disabled = methodNameInput.value.length === 0;
    });

    select_hotel.addEventListener('change', async () => {
        if (clicked) return;
        save_options();

        clicked = true;
        const hotel = select_hotel.value;

        fetchButton.disabled = true;
        select_hotel.disabled = true;
        buttomMessage.innerHTML = 'Loading hotel...';

        setTimeout(async () => {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: async (hotel) => {
                    async function getHotelData(hotel) {
                        const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel');

                        if (!hotels.ok) return;

                        const hotelsJson = await hotels.json();

                        const hotelData = hotelsJson.find(h => h.name === hotel);

                        if (!hotelData) return;

                        return hotelData;
                    }

                    // Função para setar o hotel
                    function setHotel(hotelData) {
                        const swf = document.getElementById('data.swf_link');
                        const furnidata = document.getElementById('data.furnidata');
                        const icon = document.getElementById('data.swf_link_icons');

                        swf.value = hotelData.swf;
                        furnidata.value = hotelData.furnidata;
                        icon.value = hotelData.icon;

                        function dispatchEvent(element, eventName) {
                            const event = new Event(eventName);
                            element.dispatchEvent(event);
                        }

                        dispatchEvent(swf, 'input');
                        dispatchEvent(furnidata, 'input');
                        dispatchEvent(icon, 'input');
                    }

                    const hotelData = await getHotelData(hotel);

                    if (hotel.toLowerCase() !== "custom") {
                        setHotel(hotelData);
                    }
                    else {
                        setHotel({ swf: '', furnidata: '' });
                    }

                    await chrome.runtime.sendMessage('hotelloaded');
                },
                args: [hotel]
            });
        }, 1000);
    });

    restore_options();

    fetchButton.addEventListener('click', async () => {
        save_options();

        clicked = true;
        fetchButton.disabled = true;
        buttomMessage.innerHTML = 'Fetching...';

        const method = methodClass.checked ? 'class' : 'name';
        const value = methodClass.checked ? methodClassInput.value : methodNameInput.value;
        const order = document.getElementById('order').value;

        const hotel = select_hotel.value;

        const importCustom = document.getElementById('import-custom').checked;
        const ignoreExist = document.getElementById('ignore-exist').checked;
        const onlyOneFurni = onlyOne.checked;

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: scriptToExecute,
            args: [{ method, value, hotel }, { importCustom, ignoreExist, debbug, onlyOneFurni, order }]
        });
    });
});

async function getClassNames(hotel) {
    const response = await fetch('https://vercel-api-ochre.vercel.app/hotelData?hotel=' + hotel);

    if (!response.ok) return;

    return await response.json();
}

async function writeInContentArea(text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (text) => {
            const contentArea = document.getElementById("data.classnames");

            if (!contentArea) return;

            if (contentArea.value.split('\n').includes(text)) return;

            contentArea.value += text + '\n';

            contentArea.dispatchEvent(new Event('input', { bubbles: true }));
        },
        args: [text]
    });
}

async function loadImages() {
    setLoader(document.getElementById('imgs_grid'));
    const hotel = document.getElementById('hotel').value;
    const data = await getClassNames(hotel);

    if (!data) {
        removeLoader();
        return;
    }

    const classnames = data.classnames.filter(element => !element.includes('*'));

    const imgs = document.getElementById('imgs_grid');

    const totalPages = Math.ceil(classnames.length / 51);
    let currentPage = 1;

    const createVisuals = async (page) => {
        imgs.innerHTML = '';

        const pageList = document.getElementById('current-page');
        if (pageList) pageList.innerText = `${page}/${totalPages}`;

        for await (const classname of classnames.slice((page - 1) * 51, page * 51)) {
            const div = document.createElement('div');

            div.classList.add('grid-item');

            div.innerHTML = `
                <span><img src="${data.hotelData.icon}${classname}_icon.png" alt="${classname}"/></span>
            `;

            imgs.appendChild(div);

            div.addEventListener('click', async () => {
                await writeInContentArea(classname);
            });
        }
    }

    await createVisuals(currentPage);

    if (classnames.length > 51) {
        const div = document.createElement('div');

        div.classList.add('pagination');

        div.innerHTML = `
            <button class="btn" id="prev">Anterior</button>
                <span id="current-page">${currentPage}/${totalPages}</span>
            <button class="btn" id="next">Próximo</button>
        `;

        document.querySelector('#mod-add').before(div);

        document.getElementById('prev').addEventListener('click', async () => {
            if (currentPage === 1) return;

            currentPage--;

            setLoader(imgs);

            await createVisuals(currentPage);

            removeLoader();
        });

        document.getElementById('next').addEventListener('click', async () => {
            if (currentPage === totalPages) return;

            currentPage++;

            setLoader(imgs);

            await createVisuals(currentPage);

            removeLoader();
        });
    }

    removeLoader();
}

async function toggleVisuals() {
    const visuals = document.getElementById('imgs_grid');

    if (isOn) {
        visuals.classList.remove('hidden');
        loadImages();
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

document.querySelector('#switch_opt .slider').addEventListener('click', async () => {
    isOn = !isOn;

    toggleVisuals();
    toggleImport();
});

getMessages();