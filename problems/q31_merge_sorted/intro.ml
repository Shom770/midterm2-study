;; open Assert

(* Write a function that takes two sorted lists (in ascending order)
   and yields a merged list that is also sorted and contains all the
   elements from the two input lists. *)

let rec merge_sorted (l1: int list) (l2: int list) : int list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "merge_sorted: Fill in here!"

let test () : bool =
  (merge_sorted [2; 7] [3; 5; 12]) = [2; 3; 5; 7; 12]
;; run_test "merge_sorted lists different size" test

let test () : bool =
  (merge_sorted [1; 2; 3] [4; 5; 6]) = [1; 2; 3; 4; 5; 6]
;; run_test "merge_sorted lists same size" test

let test () : bool =
 merge_sorted [] [] = []
;; run_test "merge_sorted [ADD A DESCRIPTIVE NAME FOR YOUR TEST HERE]" test

let test () : bool =
 merge_sorted [1] [] = [1]
;; run_test "merge_sorted [ADD A DESCRIPTIVE NAME FOR YOUR TEST HERE]" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = merge_sorted [] [1; 2] = [1; 2]
;; run_test "merge_sorted: first list empty" test
let test () : bool = merge_sorted [1; 3; 3] [2; 3] = [1; 2; 3; 3; 3]
;; run_test "merge_sorted: duplicates kept" test
