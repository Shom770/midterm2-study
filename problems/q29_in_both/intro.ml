;; open Assert

(* Write a function that checks whether a list of names contains a
   given name. *)

let rec contains_str (l: string list) (name: string) : bool =
  begin match l with
  | [] -> false
  | hd :: tl -> name = hd || (contains_str tl name)
  end

(* Write a function that, given two lists of names, filters the
   first list so that only those that are also in the second list
   remain. That is, your function should return a list containing all
   the elements that appear in both lists, in the order that they
   appear in the first list. *)

let rec in_both (names1: string list) (names2: string list) : string list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "in_both: Fill in here!"

let test () : bool =
  (in_both ["Brennan"; "Zac"; "Sam"; "Ally"] ["Sam"; "Rekha"]) = ["Sam"]
;; run_test "in_both Sam in both lists" test

let test () : bool =
  (in_both ["Sam"] ["Rekha"; "Zac"]) = []
;; run_test "in_both empty name list" test

let test () : bool =
 in_both [] [] = []
;; run_test "in_both [] []" test

let test () : bool =
 in_both ["a"]["b"] = []
;; run_test "in_both singleton singleton" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = in_both ["a"; "b"; "a"] ["a"] = ["a"; "a"]
;; run_test "in_both: keeps repeats from names1" test
let test () : bool = in_both ["x"; "y"; "z"] ["z"; "x"] = ["x"; "z"]
;; run_test "in_both: order of names1" test
