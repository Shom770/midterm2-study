;; open Assert
;; open HigherOrder

(* In this question the set interface, SetInterface.SET, has just four
   operations: empty, list_of_set, remove and member. *)
module OrderedListSet : SetInterface.SET = struct

  type 'a set = 'a list

  let rec remove (x: 'a) (s: 'a set) : 'a set =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "OrderedListSet.remove: Fill in here!"

  (* ----------------------------------------------------------------
     Everything from here to the end of the module is provided for testing.
     You don't need to read or change any of it.
     ---------------------------------------------------------------- *)

  let empty : 'a set = []

  let list_of_set (s: 'a set) : 'a list =
    s

  let member (x: 'a) (s: 'a set) : bool =
    fold (fun elt acc -> acc || elt = x) false s

  (* We've given you one test case below. Others will be supplied by the
     autograder. Feel free to add your own if you find it helpful. (It is
     inside the module, where a set is still visibly a sorted list.) *)

  let test () : bool =
    list_of_set (remove 3 [1; 2; 3; 4]) = [1; 2; 4]
  ;; run_test "OrderedListSet.remove: element in the middle" test


(* ---- Extra tests from the problem statement ---- *)

  let test () : bool = list_of_set (remove 4 [1; 2; 3; 4]) = [1; 2; 3]
  ;; run_test "OrderedListSet.remove: last element" test
  let test () : bool = list_of_set (remove 5 [1; 2; 3; 4]) = [1; 2; 3; 4]
  ;; run_test "OrderedListSet.remove: not present" test
  let test () : bool = list_of_set (remove 2 [1; 3; 4; 2]) = [1; 3; 4; 2]
  ;; run_test "OrderedListSet.remove: short-circuits past x" test
  let test () : bool = list_of_set (remove 2 [1; 2; 2; 2]) = [1; 2; 2]
  ;; run_test "OrderedListSet.remove: stops after the first match" test

end
