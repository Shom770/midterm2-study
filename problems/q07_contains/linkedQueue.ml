;; open Assert

module LinkedQueue : QueueInterface.QUEUE = struct

  type 'a qnode = { v: 'a;
                    mutable next: 'a qnode option }

  type 'a queue = { mutable head: 'a qnode option;
                    mutable tail: 'a qnode option }

  (* INVARIANT:
   - q.head and q.tail are either both None, or
   - q.head and q.tail both point to Some nodes, and
       - q.tail is reachable by following 'next' pointers
         from q.head
       - q.tail's next pointer is None *)

  (* Implement a function that checks whether a given element is
     in the queue. Test queue elements for equivalence using reference
     equality (==). (We want to use reference equality here to ensure
     that the element "elt" refers to the same item on the heap as the
     element you are looking for, and isn't simply just a copy.)

     Do NOT use to_list to convert the queue into a list. Rather,
     work on the linked representation directly. Your solution must be
     tail recursive. *)
  let contains (elt: 'a) (q: 'a queue) : bool =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "contains: Fill in here!"

  (* ----------------------------------------------------------------
     Everything from here to the end of the module is provided for testing.
     You don't need to read or change any of it.
     ---------------------------------------------------------------- *)

  let create () : 'a queue =
    { head = None;
      tail = None }

  let enq (elt: 'a) (q: 'a queue) : unit =
    let newnode = Some { v = elt; next = None } in
    begin match q.tail with
    | None ->
       (* Note that the invariant tells us that q.head is also None *)
       q.head <- newnode;
       q.tail <- newnode
    | Some n ->
       n.next <- newnode;
       q.tail <- newnode
    end

  let to_list (q: 'a queue) : 'a list =
    let rec loop (no: 'a qnode option) (l: 'a list) : 'a list =
      begin match no with
      | None -> List.rev l
      | Some n -> loop n.next (n.v :: l)
      end
    in loop q.head []

end

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let q = LinkedQueue.create () in
  let r = ref 2 in
  LinkedQueue.enq (ref 1) q; LinkedQueue.enq r q; LinkedQueue.enq (ref 3) q;
  LinkedQueue.contains r q && not (LinkedQueue.contains (ref 2) q)
;; run_test "contains finds the same ref, not a copy" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  not (LinkedQueue.contains 1 (LinkedQueue.create ()))
;; run_test "contains: empty queue" test
let test () : bool =
  let q = LinkedQueue.create () in
  let r = ref 2 in
  LinkedQueue.enq (ref 1) q; LinkedQueue.enq r q; LinkedQueue.enq (ref 3) q;
  let _ = LinkedQueue.contains r q in
  List.length (LinkedQueue.to_list q) = 3
;; run_test "contains: does not change the queue" test
let test () : bool =
  let q = LinkedQueue.create () in
  let rs = tr_init stress_n (fun i -> ref i) in
  List.iter (fun r -> LinkedQueue.enq r q) rs;
  LinkedQueue.contains (List.nth rs (stress_n - 1)) q
  && not (LinkedQueue.contains (ref (stress_n - 1)) q)
;; run_test "contains: large input (tail recursion)" test
