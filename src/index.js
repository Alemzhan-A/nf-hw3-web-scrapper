const axios = require('axios');
const cheerio = require('cheerio');
const connectDB = require('./db.js'); 
const Ad = require('./Ad.js');
const cron = require('node-cron');
connectDB();

const baseURL = 'https://www.olx.kz/elektronika/igry-i-igrovye-pristavki/alma-ata/q-nintendo/';

const fetchAds = async (page) => {
  try {
    const response = await axios.get(`${baseURL}?page=${page}`);
    let $ = cheerio.load(response.data);
    let ads = [];

    $('div[data-cy="l-card"]').each((i, el) => {
      const title = $(el).find('h6').text().trim();
      let rawPrice = $(el).find('[data-testid="ad-price"]').text();
      let cleanPrice = rawPrice.replace(/\.css-[a-z0-9]{6,}\{[^}]*\}/gi, '').trim().replace(/\s{2,}/g, ' ');
      const url = $(el).find('a').attr('href');
      let dateLocation = $(el).find('[data-testid="location-date"]').text().trim().replace(/\s+/g, ' ');

      ads.push({
        title,
        price: cleanPrice,
        dateLocation,
        url: `https://www.olx.kz${url}`
      });
    });

    return ads;
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
    return [];
  }
};

const main = async () => {
  let allAds = [];
  for (let page = 1; page <= 12; page++) {
    const ads = await fetchAds(page);
    for (const ad of ads) {
      const result = await Ad.updateOne({ url: ad.url }, ad, { upsert: true });
      if (result.upsertedCount === 1) {
        console.log("Ad added:", ad.title); 
      }
    }
    allAds = allAds.concat(ads);
  }

  console.log(`Total ads fetched: ${allAds.length}`);
};

cron.schedule('*/3 * * * *', () => {
  console.log('Running fetch every 3 minutes');
  main();
});
