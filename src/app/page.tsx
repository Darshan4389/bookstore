"use client";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const [books, setBooks] = useState<string[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const querySnapshot = await getDocs(collection(db, "books"));
      setBooks(querySnapshot.docs.map((doc) => doc.id));
    };

    fetchBooks();
  }, []);

  return (
    <div>
      <h1>Firebase Setup Successful 🎉</h1>
      <h2>Book Collection:</h2>
      <ul>
        {books.map((book) => (
          <li key={book}>{book}</li>
        ))}
      </ul>
    </div>
  );
}
