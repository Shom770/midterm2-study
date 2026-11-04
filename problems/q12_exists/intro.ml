;; open Assert

(* Write a function that determines whether at least one boolean value
   in the input list is true. *)

let rec exists (bools: bool list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "exists: Fill in here!"

(* (The `not` function below takes in a boolean value and returns its
   complement.) *)

let test () : bool =
  not (exists [false; false])
;; run_test "exists all false" test

let test () : bool =
  (exists [true; false; true])
;; run_test "exists multiple true" test

let test () : bool =
not (exists [])
;; run_test "exists []]" test

let test () : bool =
not (exists [false])
;; run_test "exists [false]" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = exists [true]
;; run_test "exists: [true]" test
let test () : bool = exists [false; false; true]
;; run_test "exists: true at the end" test
