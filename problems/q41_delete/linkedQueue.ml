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
       - q.tail's next pointer is None
*)

  (* Implement a function that deletes all nodes containing the value elt
     (compare using structural equality) from the queue q. This function
     should mutate the queue in place. In place means that you should not
     construct a new queue, but instead should update the pointers within
     the given queue.

     Remember here to use structural (=) equality! Do not use to_list to
     turn the queue into a list: work on the linked nodes directly. Your
     solution must be tail recursive.

     Hints:
     - You will need to both use and maintain the queue invariants

     - Think about these cases:
         . what if the queue is empty?
         . what if the only element of the queue is the value to
           be deleted?
         . what if the first or last element of the queue
           has the value to be deleted?

     - You may want to consider adding one or more helper functions
       that traverse the queue *)
  let delete (elt: 'a) (q: 'a queue) : unit =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "delete: Fill in here!"

  (* ------------------------------------------------------------------
     Everything from here to the end of the module is provided for
     testing: the other queue operations, which the tests use. You
     don't need to read or change any of it.
     ------------------------------------------------------------------ *)

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

  let deq (q: 'a queue) : 'a option =
    begin match q.head with
    | None ->
       None
    | Some n ->
       q.head <- n.next;
       begin match n.next with
       | None -> q.tail <- None; Some n.v
       | Some _ -> Some n.v
       end
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
  LinkedQueue.enq 1 q; LinkedQueue.enq 2 q; LinkedQueue.enq 3 q;
  LinkedQueue.enq 1 q; LinkedQueue.enq 1 q;
  LinkedQueue.delete 1 q;
  LinkedQueue.to_list q = [2; 3]
;; run_test "delete multiple occurrences" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let q = LinkedQueue.create () in
  List.iter (fun x -> LinkedQueue.enq x q) [1; 2; 2; 3];
  LinkedQueue.delete 2 q;
  LinkedQueue.to_list q = [1; 3]
;; run_test "delete: middle occurrences" test
let test () : bool =
  let q = LinkedQueue.create () in
  List.iter (fun x -> LinkedQueue.enq x q) [1; 1];
  LinkedQueue.delete 1 q;
  LinkedQueue.to_list q = [] && LinkedQueue.deq q = None
;; run_test "delete: everything" test
let test () : bool =
  let q = LinkedQueue.create () in
  List.iter (fun x -> LinkedQueue.enq x q) [1; 2; 3];
  LinkedQueue.delete 3 q;
  LinkedQueue.enq 4 q;
  LinkedQueue.to_list q = [1; 2; 4]
;; run_test "delete: tail updated so enq still works" test
let test () : bool =
  let q = LinkedQueue.create () in
  LinkedQueue.delete 1 q;
  LinkedQueue.to_list q = []
;; run_test "delete: empty queue" test
let test () : bool =
  let q = LinkedQueue.create () in
  for i = 0 to stress_n - 1 do LinkedQueue.enq (i mod 2) q done;
  LinkedQueue.delete 0 q;
  List.length (LinkedQueue.to_list q) = stress_n / 2
;; run_test "delete: large input (tail recursion)" test
