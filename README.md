# FLYGUY2023APP - UI for FLYGUY Hair Store

This is a Next.js app that makes use of a PostgreSQL database. You will need a local copy of postgres or alter the code to support a cloud provider. The DB schema and seeding files are part of the [FLYGUY2023db sibling repository](https://github.com/phillipc421/flyguy2023db).

## Stack

I will update this README as I continue development, but the planned tech stack is as follows:

- Next.js - front end
- Node.js - server (only Express!)
  - Next-Auth for OAuth
  - Stripe for payment processing
- PostgreSQL - db
- Vercel - Cloud provider (probably switch to AWS)

## The Business

The business is technically functional, as in I still have inventory that can be sold, but I'm not actively marketing or pursuing growth. I consider the business failed, and I poke fun at this in the front end static code, but it was fun and a good learning experience. We also actually did make quality products, and the few customers we did have had good things to say. We still have some repeat customers to this day. Email me or wait for this project to be live if you want to buy some 😉.

As I have shifted focus to software engineering, I thought it would be a good project to reimplement what was once a Shopify store to a fully custom and self-serviced application.

## Setup

`npm run dev` to boot up the dev server, all the basic Next.js defaults. Again, you will need a local copy of postgres and configure a db to point to in your `.env` file(s). See the sibling repository, [flyguy2023db](https://github.com/phillipc421/flyguy2023db), if you want to mimic my local setup. Extend as you see fit.
