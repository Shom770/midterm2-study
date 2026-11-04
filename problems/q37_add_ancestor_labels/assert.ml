(* Minimal stand-in for the CIS 1200 Assert module.
   run_test prints one line per test; a summary is printed at exit. *)

let passed = ref 0
let failed = ref 0

let report (desc : string) (ok : bool) (detail : string) : unit =
  if ok then (incr passed; Printf.printf "PASS  %s\n%!" desc)
  else (incr failed; Printf.printf "FAIL  %s%s\n%!" desc
          (if detail = "" then "" else "  (" ^ detail ^ ")"))

let run_test (desc : string) (f : unit -> bool) : unit =
  match f () with
  | true -> report desc true ""
  | false -> report desc false "returned false"
  | exception Stack_overflow -> report desc false "stack overflow: not tail recursive?"
  | exception e -> report desc false ("raised " ^ Printexc.to_string e)

(* Passes when f raises an exception. *)
let run_failing_test (desc : string) (f : unit -> bool) : unit =
  match f () with
  | _ -> report desc false "expected an exception"
  | exception _ -> report desc true ""

let test_property_on (name : string) (prop : 'a -> bool) (inputs : 'a list) : unit =
  List.iteri
    (fun i x -> run_test (Printf.sprintf "%s (input %d)" name (i + 1)) (fun () -> prop x))
    inputs

let summary () : unit =
  Printf.printf "SUMMARY %d/%d passed\n%!" !passed (!passed + !failed)

(* Size of the "large input" tests that check for tail recursion. *)
let stress_n = 1000

(* BEGIN-LOCAL: the browser grader calls summary () itself instead. *)
let () = at_exit summary
(* END-LOCAL *)

(* Tail-recursive List.init, so building big test inputs never uses the stack. *)
let tr_init (n : int) (f : int -> 'a) : 'a list =
  let rec go (i : int) (acc : 'a list) : 'a list =
    if i < 0 then acc else go (i - 1) (f i :: acc)
  in
  go (n - 1) []
