/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
      url:'postgresql://neondb_owner:BthxV43KdoJW@ep-winter-recipe-a5z806fc.us-east-2.aws.neon.tech/ace-interviews?sslmode=require'
    }
  };