async function loadHotels() {
    const hotels = await fetch('https://vercel-api-ochre.vercel.app/hotel');

    if (!hotels.ok) throw new Error('Não foi possível carregar os hotéis');

    const hotelsJson = await hotels.json();

    const selectHotel = document.querySelector('#hotel');

    hotelsJson.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.name;
        option.innerText = hotel.name;

        selectHotel.appendChild(option);
    });

    const config = JSON.parse(localStorage.getItem('config'));

    if (config) {
        selectHotel.value = config.hotel;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
            args: [config.hotel]
        });
    }
}

loadHotels().catch(err => {
    console.error(err);
});