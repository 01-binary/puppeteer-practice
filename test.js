import puppeteer from "puppeteer";

// const colors = require('colors/safe');

// (async () => {
//   const args = ["--proxy-server=socks5://127.0.0.1:9050"];
//   const browser = await puppeteer.launch({ args });
//   const page = await browser.newPage();
//   await page.goto("https://check.torproject.org/");
//   const isUsingTor = await page.$eval("body", (el) =>
//     el.innerHTML.includes(
//       "Congratulations. This browser is configured to use Tor"
//     )
//   );

//   if (!isUsingTor) {
//     // console.log(colors.red.bold('Not using Tor. Closing...'));
//     console.log("Not using Tor. Closing...");
//     return await browser.close();
//   }

//   console.log("Using Tor. Continuing... ");

//   await page.goto("https://propub3r6espa33w.onion/");

//   // You would add additional code to do stuff...

//   // Then when you're done, just close
//   await browser.close();
// })();

// console.log("별점 4.9".includes("별점"));


