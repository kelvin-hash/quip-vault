"use client";
import {SignInButton, UserButton} from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {
  const [joke, setJoke] = useState(null);
  const [loading,setLoading]=useState(false);
  
  const fetchJoke = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/joke");
      const data = await res.json();
      if (res.status ==!200) {
        alert(data.message ||data.error);
        setJoke("");
        return;
    }
      setJoke(data.joke);
    } catch (error) {
      console.error("Error fetching joke:", error);
    }
    finally{
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="absolute top-4 left-4" >
        <span className="text-sm text-gray-500 dark:text-gray-400">
          QUIPVAULT
        </span>
      </div>
      <div className="absolute top-4 right-4">
        <nav className="flex space-x-4">
        <SignInButton mode="modal" />
        <UserButton />
        </nav>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
        Welcome to QuipVault
      </h1>
      <button
        onClick={fetchJoke}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "bet this will make you crack" : "Fetch a Random Joke"}
      </button>
      {joke && (
        <div className="mt-6 p-4 bg-white rounded shadow">
          <p className="text-lg text-gray-700">{joke}</p>
        </div>
      )}
    </div>
  );
}
