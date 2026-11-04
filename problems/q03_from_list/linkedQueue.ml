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

  (* Implement a function that converts a list [v1; v2; ...; vn] into
     a queue with v1 at the head and vn at the tail. Do not use any
     List library functions. Your solution must be tail recursive. *)
  let from_list (l: 'a list) : 'a queue =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "from_list: Fill in here!"

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

  let is_empty (q: 'a queue) : bool =
    q.head = None

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
  let q = LinkedQueue.from_list [1; 2; 3] in
  LinkedQueue.deq q = Some 1 && LinkedQueue.to_list q = [2; 3]
;; run_test "from_list [1; 2; 3]; deq" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let q = LinkedQueue.from_list [] in
  LinkedQueue.is_empty q && LinkedQueue.valid q
;; run_test "from_list: empty list" test
let test () : bool =
  let q = LinkedQueue.from_list [7] in
  LinkedQueue.valid q && LinkedQueue.to_list q = [7]
;; run_test "from_list: one element" test
let test () : bool =
  let q = LinkedQueue.from_list [1; 2; 3] in
  LinkedQueue.enq 4 q;
  LinkedQueue.valid q && LinkedQueue.to_list q = [1; 2; 3; 4]
;; run_test "from_list: tail is set so enq still works" test
let test () : bool =
  let l = tr_init stress_n (fun i -> i) in
  let q = LinkedQueue.from_list l in
  LinkedQueue.valid q && LinkedQueue.to_list q = l
;; run_test "from_list: large input (tail recursion)" test
