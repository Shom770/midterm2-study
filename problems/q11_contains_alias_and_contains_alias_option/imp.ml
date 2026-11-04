;; open Assert

(* Write a function that, given a value x and a list of values,
   determines whether any of the elements in the list is an alias of
   x. (HINT: use reference equality!) *)
let rec contains_alias (x: 'a) (l: 'a list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "contains_alias: Fill in here!"

(* Now write a function that determines whether a given value x is
   aliased with one of the values inside an option in the options list. *)
let rec contains_alias_option (x: 'a) (l: 'a option list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "contains_alias_option: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example tests at the very
   end, which are there for you to run and extend).
   ------------------------------------------------------------------ *)

(* A record with one mutable field, count; the example tests use it. *)
type state = {mutable count: int}

(* We've given you a few test cases below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let r1 = { count = 5 } in
  let r2 = { count = 5 } in
  not (contains_alias r1 [r2])
;; run_test "contains_alias singleton no alias" test

let test () : bool =
  let r1 = { count = 5 } in
  let r2 = { count = 5 } in
  contains_alias r1 [r2; r1]
;; run_test "contains_alias multi-element list alias exists" test

let test () : bool =
  let r = { count = 5 } in
  let o1 = Some r in
  contains_alias_option r [o1]
;; run_test "contains_option_alias singleton contains alias" test

let test () : bool =
  let r = { count = 5 } in
  let o2 = Some { count = 5 } in
  not (contains_alias_option r [o2])
;; run_test "contains_option_alias singleton does not contain alias" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let r1 = { count = 5 } in
  not (contains_alias r1 [])
;; run_test "contains_alias: empty list" test
let test () : bool =
  let r1 = { count = 5 } in
  contains_alias_option r1 [None; Some r1]
;; run_test "contains_alias_option: alias after a None" test
let test () : bool =
  let r1 = { count = 5 } in
  not (contains_alias_option r1 [None; None])
;; run_test "contains_alias_option: only Nones" test
