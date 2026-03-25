import {supabase} from "../../../lib/supabase.js";
import {redis} from "../../../lib/redis.js";
import {auth} from "@clerk/nextjs/server";

export async function GET(req){
   try {
   const {userId} =  await auth();
   console.log("User ID:", userId);
   if (!userId) {
   //get the ip address of the user
   const ip = req.headers.get('x-forwarded-for') || 'unknown';
   // construct the users key using the ip
   const key =  `quipvault:v1:rate_limit:${ip}`;
   //the limit of requests per minute
   const ipLimit = 5;
   //the window after which the no of requests will reset in seconds
   const window = 60;
   //increment the no of requests for the user in redis
   const ipRequests = await redis.incr(key);
   //check if the user has exceeded the rate limit
   if (ipRequests > ipLimit) {
      return new Response(
         JSON.stringify({error: "Rate limit exceeded"}),
         {status: 429}
      );
   }
   //set the expiry for the key if it's the first request
   if (ipRequests === 1) {
      await redis.expire(key, window);
   }} else {
   const idLimit = 10;
   const idKey = `quipvault:v1:rate_limit:user:${userId}`;
   const idRequests = await redis.incr(idKey);
   if (idRequests > idLimit) {
      return new Response(
         JSON.stringify({error: "Rate limit exceeded"}),
         {status: 429}
      );
   }
   if (idRequests === 1) {
      await redis.expire(idKey, window);
   }}
   //fetch jokes from the database
   const {data,error} = await supabase.from('jokes').select('*');
   //handle error
   if (error){
      return new Response(
         JSON.stringify({error: error.message}),
         {status: 500}
      )
   }
   //check if data is empty
   if (!data || data.length === 0){
      return new Response(
         JSON.stringify({message: "No jokes found"}),
         {status: 404}
      );
   }
   //pick a random joke from the data
   const randomIndex = Math.floor(Math.random() * data.length);
   const randomJoke = data[randomIndex];
   //return the random joke
   return new Response(
      JSON.stringify({Joke:randomJoke.text}),
      {status: 200}
   );
   } catch (error) {
      console.error("Error fetching joke:", error);
      return new Response(
         JSON.stringify({error: "Internal server error"}),
         {status: 500}
      );
   }
  
}