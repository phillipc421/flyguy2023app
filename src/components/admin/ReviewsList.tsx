import { DatabaseReview } from "@/types/Review";
import Review from "./Review";

export interface ReviewsListProps {
  reviews: DatabaseReview[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <section>
      <h2>Existing Reviews</h2>
      {reviews.map((review) => (
        <Review key={review.id} review={review}></Review>
      ))}
    </section>
  );
}
