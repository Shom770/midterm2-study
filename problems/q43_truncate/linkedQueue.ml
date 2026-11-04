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

  (* Implement a function that truncates a queue after the first
     occurrence of a specified element. (i.e. it removes all elements
     from the queue that follow the first occurrence of the given
     element.) This means the specified element is still in the resulting
     queue. The function should mutate the queue "in place," --
     i.e., you should not construct a new queue, but instead should
     update the pointers within the given queue.

     Again, remember to use reference (==) equality! Do not use to_list
     to turn the queue into a list: work on the linked nodes directly. *)
  let truncate (elt: 'a) (q: 'a queue) : unit =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "truncate: Fill in here!"

  (* ----------------------------------------------------------------
     Everything from here to the end of the module is provided for testing.
     You don't need to read or change any of it.
     ---------------------------------------------------------------- *)

  let rec find_last_node (qn: 'a qnode) : 'a qnode option =
    let rec loop (curr: 'a qnode) (seen: 'a qnode list) : 'a qnode option =
      begin match curr.next with
      | None -> Some curr
      | Some n ->
        let rec contains_alias (qnl :'a qnode list) : 'a qnode option =
          begin match qnl with
          | [] -> loop n (curr :: seen)
          | h :: t -> if n == h then None else contains_alias t
          end in
        contains_alias seen
      end
    in loop qn []

  let valid (q: 'a queue) : bool =
    begin match q.head, q.tail with
    | None, None -> true
    | Some qh, Some qt ->
       begin match find_last_node qh with
       | Some n -> qt == n (* the tail points to the last node *)
       | None -> false
       end
    | _, _ -> false
    end

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
    failwith "Omitted (not relevant to this question)"

  let to_list (q: 'a queue) : 'a list =
    let rec loop (no: 'a qnode option) (l: 'a list) : 'a list =
      begin match no with
      | None -> List.rev l
      | Some n -> loop n.next (n.v :: l)
      end
    in loop q.head []

  let length (q: 'a queue) : int =
    let rec loop (no: 'a qnode option) (len: int) : int =
      begin match no with
      | None -> len
      | Some n -> loop n.next (len + 1)
      end
    in loop q.head 0

end

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let q = LinkedQueue.create () in
  LinkedQueue.enq 2 q; LinkedQueue.enq 3 q; LinkedQueue.enq 5 q;
  LinkedQueue.enq 1 q; LinkedQueue.enq 1 q; LinkedQueue.enq 2 q;
  LinkedQueue.truncate 1 q;
  LinkedQueue.to_list q = [2; 3; 5; 1]
;; run_test "truncate repeated element" test

(* ---- Extra tests from the problem statement ---- *)

let make (l : int list) : int LinkedQueue.queue =
  let q = LinkedQueue.create () in
  List.iter (fun x -> LinkedQueue.enq x q) l; q
let test () : bool =
  let q = make [1; 2; 3; 4] in
  LinkedQueue.truncate 2 q;
  LinkedQueue.valid q && LinkedQueue.to_list q = [1; 2]
;; run_test "truncate: cut after 2" test
let test () : bool =
  let q = make [1; 2; 3] in
  LinkedQueue.truncate 5 q;
  LinkedQueue.valid q && LinkedQueue.to_list q = [1; 2; 3]
;; run_test "truncate: element not present" test
let test () : bool =
  let q = make [1; 2; 3; 4] in
  LinkedQueue.truncate 2 q; LinkedQueue.enq 9 q;
  LinkedQueue.valid q && LinkedQueue.to_list q = [1; 2; 9]
;; run_test "truncate: tail updated so enq still works" test
let test () : bool =
  let q = make (tr_init stress_n (fun i -> i)) in
  LinkedQueue.truncate (stress_n / 2) q;
  LinkedQueue.valid q && LinkedQueue.length q = stress_n / 2 + 1
;; run_test "truncate: large input (tail recursion)" test
