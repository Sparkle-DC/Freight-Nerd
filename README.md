# FreightNerd

FreightNerd is a static collection of free freight, logistics, and shipping calculators.

The site is designed to run entirely in the browser. There is no backend, no account system, and no server-side data storage in this repository.

## Tools

- CBM Calculator
- Freight Class & Density Calculator
- DIM Weight Calculator
- Pallet Calculator
- Container Loading Optimizer
- Packing List Generator
- Rate Per Mile Calculator
- Freight Profit Calculator
- Fuel Surcharge Calculator
- Landed Cost Estimator
- Accessorials Estimator
- HS Code Planning Helper
- Transit Time Comparator
- Carbon Emissions Calculator
- Unit Converter
- Browser Notepad
- Cold Email Generator

## Local preview

This is a static HTML site. You do not need Node.js to preview the existing files.

From the repository root, run a simple local server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

## CSS Development

The site uses a pre-compiled Tailwind CSS file (`assets/style.css`) to ensure the fastest possible page load speeds and SEO Core Web Vitals. 

If you add new Tailwind classes to the HTML, you must recompile the CSS. To do this, you need Node.js installed:

```bash
npm install
npm run build
```

## Deployment

This repo is suitable for GitHub Pages or any static host. The project uses relative paths and works both at the root of a domain or within a subdirectory like `/Freight-Nerd/`.

If deploying to a custom domain, no manual path updates are required.

## Privacy model

Most tools calculate directly in the browser and do not send data to a server. The Notepad tool stores notes in the visitor's own browser using `localStorage`. Users should not store passwords, sensitive personal data, confidential shipment documents, or regulated information in the browser notepad.

## Accuracy disclaimer

FreightNerd tools are planning aids only. Freight rates, duties, taxes, fuel surcharges, transit times, and classifications can vary by carrier, lane, country, contract, trade agreement, and current regulations. Always verify important shipment, customs, and pricing decisions with the relevant carrier, broker, customs authority, or qualified professional.

## Security notes

This is a static site. There are no server-side secrets required. Do not commit `.env`, API keys, private customer data, or production credentials to this repository.
