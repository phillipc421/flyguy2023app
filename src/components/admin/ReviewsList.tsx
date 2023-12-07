import { DatabaseReview } from "@/types/Review";
import Review from "./Review";

export interface ReviewsListProps {
  reviews: DatabaseReview[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <>
      <h3>Existing Reviews</h3>
      {reviews.map((review) => (
        <Review key={review.id} review={review}></Review>
      ))}
    </>
  );
}
