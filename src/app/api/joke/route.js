import {supabase} from "../../../lib/supabase.js";
import {redis} from "../../../lib/redis.js";
import {auth} from "@clerk/nextjs/server";

export async function GET(req){
   try {
   const {userId} =  await auth();
   //get the ip address of the user
   const ip = req.headers.get('x-forwarded-for') || 'unknown';
   const identifier = userId ? userId : ip;
   //limit depending on the user
   const limit = userId ? 10 : 3;
   // construct the users key using the ip
   const key =  `quipvault:v1:rate_limit:${identifier}`;
   // get the current time 
   const now =Date.now();
   //define the window
   const windowSize = 60000;  
   const count = await redis.eval(
      `redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
         local c = redis.call('ZCARD', KEYS[1])
         if c < tonumber(ARGV[3]) then
         redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2])
         redis.call('EXPIRE', KEYS[1], 60)
         end
         return c + 1`,
      [key], // KEYS[1]
      [now - windowSize, now, limit] // ARGV[1], ARGV[2], ARGV[3]
   );
    if (count > limit){
      return new Response (
         JSON.stringify({message:"rate limit reached"}),
         {status:429}
      )
    }
   //fetch jokes from the database
   const {data,error} = await supabase.rpc('get_random_joke');
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
   //return the random joke
   const joke = data[0].text;
   console.log(joke);
   return new Response(
      JSON.stringify({joke}),
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