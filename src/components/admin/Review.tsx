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
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      body: JSON.stringify({ id: review.id }),
    });
    const data = await res.json();
    if (data.message) router.refresh();
  };

  return (
    <article>
      <h4>{review.reviewer}</h4>
      <p>{review.content}</p>
      <button onClick={clickHandler}>Delete</button>
    </article>
  );
}
