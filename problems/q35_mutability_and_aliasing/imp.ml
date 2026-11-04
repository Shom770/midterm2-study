;; open Assert

(* Implement a function `iter` that iterates through each element of a list in
   order and calls a side-effecting function on each element. Do not use any
   List library functions. *)
let rec iter (f: 'a -> unit) (l: 'a list) : unit =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "iter: Fill in here!"

(* A record with one mutable field, count. *)
type state = {mutable count: int}

(* Write a function to increment the contents of a state record
   containing a single int field called count. The increment function
   should return the old value of the count field. *)
let state_incr (r : state) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "state_incr: Fill in here!"

(* Write a function to swap the contents of two state record cells.
   Note that swap returns unit, and the "<-" operator will return unit.
   You can also return unit directly with "()". *)
let swap (r1: state) (r2: state) : unit =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "swap: Fill in here!"

(* Write a function that determines if two record cells are aliased by
   using the reference equality operator (==). *)
let states_aliased (r1: state) (r2: state) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "states_aliased: Fill in here!"

(* We've given you a few test cases below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let l = [{count = 1}; {count = 2}; {count = 3}] in
  iter (fun r -> r.count <- 1 + r.count) l;
  l = [{count = 2}; {count = 3}; {count = 4}]
;; run_test "iter non-empty list" test

let test () : bool =
  let r = { count = 0 } in
  state_incr r = 0 && state_incr r = 1 && r.count = 2
;; run_test "state_incr incrementing twice" test

let test () : bool =
  let r1 = { count = 5 } in
  let r2 = { count = 6 } in
  let _ = swap r1 r2 in
  (6, 5) = (r1.count, r2.count)
;; run_test "swap records with different contents" test

let test () : bool =
  let r1 = { count = 5 } in
  let r2 = { count = 5 } in
  let b = states_aliased r1 r2 in
  (false, true, true) = (b, r1.count = 5, r2.count = 5)
;; run_test "states_aliased different records with same value not aliased" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let acc = ref [] in
  iter (fun x -> acc := x :: !acc) [1; 2; 3];
  !acc = [3; 2; 1]
;; run_test "iter: visits elements in order" test
let test () : bool =
  let r1 = { count = 5 } in
  states_aliased r1 r1
;; run_test "states_aliased: same record" test
let test () : bool =
  let r = { count = 4 } in
  swap r r; r.count = 4
;; run_test "swap: a record with itself" test
