;; open Assert

(* NOTE: Throughout this assignment, you may NOT use any library functions
   (in particular, any functions defined in the `List` module), unless the
   instructions specifically say to. You will lose points if you do this. *)

let rec fold (combine: 'a -> 'b -> 'b) (base: 'b) (l: 'a list) : 'b =
  begin match l with
  | [] -> base
  | x :: xs -> combine x (fold combine base xs)
  end

(* Use `fold` to write a `concat` function that takes a list of lists and
   "flattens" it into a single list containing all the elements of the lists,
   in order. It is okay to use the built-in `@` function, which appends two
   lists. (When passing `@` as an argument to another function, you need to
   enclose it in parens to avoid confusing the parser -- i.e., write `(@)`
   instead of just `@`.) Do not add `rec` to the declaration of `concat`. *)

let concat (l: 'a list list) : 'a list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "HigherOrder.concat: Fill in here!"

(* We've given you a few test cases below. Others will be supplied by
   the autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  concat [[]] = []
;; run_test "concat: list of empty list returns empty" test

let test () : bool =
  concat [[1; 2]; [3]; []; [4; 5; 6]] = [1; 2; 3; 4; 5; 6]
;; run_test "concat: list containing more than two lists" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = concat [[1; 2]; [3]; [4; 5; 6]] = [1; 2; 3; 4; 5; 6]
;; run_test "concat: example from the problem" test
let test () : bool = concat [] = []
;; run_test "concat: empty outer list" test
let test () : bool = concat [["a"]; []; ["b"; "c"]] = ["a"; "b"; "c"]
;; run_test "concat: strings with an empty list inside" test
