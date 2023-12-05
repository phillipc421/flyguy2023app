"use client";

import { DatabaseReview } from "@/types/Review";
import { useRouter } from "next/navigation";

export interface ReviewProps {
  review: DatabaseReview;
}

export default function Review({ review }: ReviewProps) {
  const router = useRouter();
  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = async (
    e
  ) => {
    const res = await fetch("/api/admin", {
      method: "DELETE",
      body: JSON.stringify({ id: review.id }),
    });
    const data = await res.json();
    if (data.message) router.refresh();
  };

  return (
    <article>
      <h3>{review.reviewer}</h3>
      <p>{review.content}</p>
      <button onClick={clickHandler}>Delete</button>
    </article>
  );
}
