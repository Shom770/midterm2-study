;; open Assert
;; open HigherOrder

(* In this question the set interface, SetInterface.SET, has just four
   operations: empty, list_of_set, add and set_of_list. *)
module OrderedListSet : SetInterface.SET = struct

  (* We begin by stating that the abstract type 'a set is actually represented
     here as an `'a list`. We will maintain the additional invariants that this
     list is sorted in ascending order and contains no duplicates. *)

  type 'a set = 'a list

  (* The next function will be a bit more complex than just cons-ing the
     element onto the list. Remember, we're maintaining the invariants that
     this list is sorted and contains no duplicate elements. You may NOT use a
     sorting function (such as `List.sort`) to accomplish this. *)

  let rec add (x: 'a) (s: 'a set) : 'a set =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "OrderedListSet.add: Fill in here!"

  (* ----------------------------------------------------------------
     Everything from here to the end of the module is provided for testing.
     You don't need to read or change any of it.
     ---------------------------------------------------------------- *)

  let empty : 'a set = []

  let list_of_set (s: 'a set) : 'a list =
    s

  let set_of_list (l: 'a list) : 'a set =
    fold add empty l

end

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let s = OrderedListSet.set_of_list [1; 2; 4] in
  OrderedListSet.list_of_set (OrderedListSet.add 3 s) = [1; 2; 3; 4]
;; run_test "OrderedListSet.add: element in the middle" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  OrderedListSet.list_of_set (OrderedListSet.add 3 (OrderedListSet.set_of_list [1; 2; 3]))
  = [1; 2; 3]
;; run_test "OrderedListSet.add: already present" test
let test () : bool =
  OrderedListSet.list_of_set (OrderedListSet.add 1 OrderedListSet.empty) = [1]
;; run_test "OrderedListSet.add: into empty" test
let test () : bool =
  OrderedListSet.list_of_set (OrderedListSet.set_of_list [5; 1; 4; 1; 9; 0])
  = [0; 1; 4; 5; 9]
;; run_test "OrderedListSet.add: sorted, no duplicates" test
