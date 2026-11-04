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

(* As in the rest of this homework, your solution must be tail recursive. *)

(* Write a function that reverses the order of the elements in a deque,
   in place: afterwards the deque consists of the same dqnodes as before
   (the old tail node is the new head node, and so on). *)
let reverse (q: 'a deque) : unit =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "reverse: Fill in here!"

(* ------------------------------------------------------------------
   Testing (feel free to add tests or modify this one)
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
  (* the deque 1, 2, 3, built by hand *)
  let n1 = { v = 1; prev = None; next = None } in
  let n2 = { v = 2; prev = Some n1; next = None } in
  let n3 = { v = 3; prev = Some n2; next = None } in
  n1.next <- Some n2; n2.next <- Some n3;
  let d = { head = Some n1; tail = Some n3 } in
  reverse d;
  to_list d = [3; 2; 1]
;; run_test "reverse: three-element deque" test

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
  reverse d; to_list d = [] && consistent d
;; run_test "reverse: empty deque" test
let test () : bool =
  let d = deque_of_list [1] in
  reverse d; to_list d = [1] && consistent d
;; run_test "reverse: one element" test
let test () : bool =
  let d = deque_of_list [1; 2; 3; 4] in
  let old_head = d.head in
  reverse d;
  consistent d && to_list d = [4; 3; 2; 1]
  && (match old_head, d.tail with Some a, Some b -> a == b | _ -> false)
;; run_test "reverse: same nodes, links agree both ways" test
let test () : bool =
  let l = tr_init stress_n (fun i -> i) in
  let d = deque_of_list l in
  reverse d;
  consistent d && to_list d = List.rev l
;; run_test "reverse: large input (tail recursion)" test
