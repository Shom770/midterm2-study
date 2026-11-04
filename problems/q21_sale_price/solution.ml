(* ------------------------------------------------------------------ *)
(* sale_price *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [sale_price price percent_off] is the price in cents after taking
   [percent_off] percent off [price].

   The discount is (price * percent_off) / 100, using integer division,
   and the sale price is [price] minus the discount.

     sale_price 1000 25 = 750
     sale_price 999 10 = 900
     sale_price 5 50 = 3
     sale_price 100 0 = 100
*)
let sale_price (price : int) (percent_off : int) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: sale_price"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = sale_price 1000 25 = 750
;; run_test "sale_price: 25 percent off" test
let test () : bool = sale_price 999 10 = 900
;; run_test "sale_price: fraction of a cent dropped" test
let test () : bool = sale_price 5 50 = 3
;; run_test "sale_price: multiply before dividing" test
let test () : bool = sale_price 100 0 = 100
;; run_test "sale_price: no discount" test
