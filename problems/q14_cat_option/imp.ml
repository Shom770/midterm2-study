;; open Assert

let rec fold (combine: 'a -> 'b -> 'b) (base: 'b) (l: 'a list) : 'b =
  begin match l with
  | [] -> base
  | x :: xs -> combine x (fold combine base xs)
  end

(* Use `fold` to write a function that takes a list of optional values and
   returns a list containing all of the values that are present (i.e.,
   stripping off the `Some`s and dropping the `None`s), in order. Do not
   add `rec` to the declaration of `cat_option`, and do not use the `List`
   module. *)
let cat_option (l: 'a option list) : 'a list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "cat_option: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example test at the very
   end, which is there for you to run and extend).
   ------------------------------------------------------------------ *)

let rec transform (f: 'a -> 'b) (l: 'a list) : 'b list =
  begin match l with
  | [] -> []
  | x :: xs -> f x :: transform f xs
  end

(* Provided: partial_transform, which uses your cat_option. One of the
   autograder's tests calls it. *)
let partial_transform (f: 'a -> 'b option) (l: 'a list) : 'b list =
  cat_option (transform f l)

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  cat_option [ Some 1; None; Some 2; Some 0; None; None] = [1;2;0]
;; run_test "cat_option list contains Some and None options" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = cat_option [None; None] = []
;; run_test "cat_option: only Nones" test
let test () : bool = cat_option [] = []
;; run_test "cat_option: empty" test
let test () : bool =
  partial_transform (fun x -> if x > 0 then Some (x * 2) else None) [1; -1; 2] = [2; 4]
;; run_test "partial_transform: uses cat_option" test
