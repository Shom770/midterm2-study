;; open Assert

(* A deque is represented like a linked queue, but with links in both
   directions: a dqnode contains a value and references to the next AND
   PREVIOUS nodes in the structure. *)

type 'a dqnode = {
  v: 'a;
  mutable next: 'a dqnode option;
  mutable prev: 'a dqnode option;
}

type 'a deque = {
  mutable head: 'a dqnode option;
  mutable tail: 'a dqnode option;
}

(* INVARIANT: either...

   The deque is empty, and the head and tail are both None, or

   the deque is non-empty, and
   - head = Some n1 and tail = Some n2, where
      (a) n2 is reachable from n1 by following 'next' pointers
      (b) n2.next = None   (there is no element after the tail)

      (c) n1 is reachable from n2 by following 'prev' pointers
      (d) n1.prev = None   (there is no element before the head)

   - for every node n in the deque:
      (e) if n.next = Some m then
            m.prev = Some n

      (f) if n.prev = Some m then
            m.next = Some n *)

(* Write two functions, insert_head and insert_tail, for adding elements to
   the head and tail of a deque, respectively.

   You may assume that the deque input satisfies the deque invariants.

   Just as with queues, you should update the deque in place, and make sure
   to maintain the invariants. *)
let insert_head (x: 'a) (q: 'a deque) : unit =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "insert_head: Fill in here!"

let insert_tail (x: 'a) (q: 'a deque) : unit =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "insert_tail: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example test at the very
   end, which is there for you to run and extend).
   ------------------------------------------------------------------ *)

let create () : 'a deque =
  { head = None; tail = None }

let to_list (q: 'a deque) : 'a list =
  let rec loop (no: 'a dqnode option) (l: 'a list) : 'a list =
    begin match no with
    | None -> l
    | Some n -> loop n.prev (n.v :: l)
    end
  in
  loop q.tail []

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let d = create () in
  insert_head 2 d;
  insert_tail 3 d;
  insert_head 1 d;
  to_list d = [1; 2; 3]
;; run_test "insert_head and insert_tail into a non-empty deque" test

(* ---- Extra tests from the problem statement ---- *)

(* Test helpers: build a deque by hand and check its links. *)
let deque_of_list (l : 'a list) : 'a deque =
  let d = { head = None; tail = None } in
  let rec go (l : 'a list) : unit =
    begin match l with
    | [] -> ()
    | x :: rest ->
      let n = { v = x; next = None; prev = d.tail } in
      begin match d.tail with
      | None -> d.head <- Some n
      | Some t -> t.next <- Some n
      end;
      d.tail <- Some n;
      go rest
    end
  in
  go l; d

(* Elements read from head to tail by following next pointers. *)
let forward_list (q : 'a deque) : 'a list =
  let rec loop (no : 'a dqnode option) (acc : 'a list) : 'a list =
    begin match no with
    | None -> List.rev acc
    | Some n -> loop n.next (n.v :: acc)
    end
  in
  loop q.head []

let ends_ok (q : 'a deque) : bool =
  begin match q.head, q.tail with
  | None, None -> true
  | Some h, Some t ->
    (match h.prev with None -> true | Some _ -> false)
    && (match t.next with None -> true | Some _ -> false)
  | _ -> false
  end

let consistent (q : 'a deque) : bool =
  ends_ok q && forward_list q = to_list q

let test () : bool =
  let d = create () in
  insert_tail 1 d;
  consistent d && to_list d = [1]
  && (match d.head, d.tail with Some h, Some t -> h == t | _ -> false)
;; run_test "insert_tail: into empty sets head and tail" test
let test () : bool =
  let d = create () in
  insert_head 1 d;
  consistent d && to_list d = [1]
  && (match d.head, d.tail with Some h, Some t -> h == t | _ -> false)
;; run_test "insert_head: into empty sets head and tail" test
let test () : bool =
  let d = create () in
  insert_head 2 d; insert_tail 3 d; insert_head 1 d; insert_tail 4 d;
  consistent d && to_list d = [1; 2; 3; 4]
;; run_test "insert_head/insert_tail: links agree both ways" test
