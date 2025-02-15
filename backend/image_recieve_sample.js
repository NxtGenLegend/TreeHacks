const fs = require('fs');
const axios = require('axios');



async function fetchImage(query) {
    try {
        const response = await axios.post(`http://localhost:8000/query?query=${query}`);
        const data = response.data;
        console.log(data);
        const imageBuffer = Buffer.from(data[0].base64, 'base64');
        // fs.writeFileSync('fetched_image.jpg', imageBuffer);
        // console.log('Image saved successfully!');
    } catch (error) {
        console.error('Error fetching the image:', error);
    }
}

fetchImage('capital of france');
