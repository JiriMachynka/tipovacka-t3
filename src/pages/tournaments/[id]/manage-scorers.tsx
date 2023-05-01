import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Formik } from "formik";
import { Edit } from "lucide-react";
import { type GetServerSidePropsContext } from "next";
import { useState } from "react";
import { api } from "~/utils/api";

type TEditedScorer = {
  id: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
}

export const MyTips = ({ id }: { id: string }) => {
  const [editedScorer, setEditedScorer] = useState<TEditedScorer | null>(null);
  const { toast } = useToast();
  const utils = api.useContext();
  
  const { data: scorers } = api.tournament.getScorers.useQuery({ tournamentId: parseInt(id) });
  
  const { mutate: updateScorer } = api.tournament.updateScorer.useMutation({
    onSuccess() {
      setEditedScorer(null);
      void utils.tournament.invalidate();
      toast({
        title: "Uloženo",
        description: "Góly/asistence byly uloženy",
      });

    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit góly/asistence",
      });
    }
  });

  if (!scorers) return <h2>Na turnaji nejsou zatím žádní střelci</h2>

  return (
    <SingleTournamentLayout>
      <>
        {editedScorer && (
          <AlertDialog open={!!editedScorer}>
            <AlertDialogContent className="bg-[#11132b]">
              <Formik
                initialValues={{
                  goals: editedScorer.goals,
                  assists: editedScorer.assists
                }}
                onSubmit={(values) => {
                  const { goals, assists } = values;
                  updateScorer({
                    id: editedScorer.id,
                    goals,
                    assists
                  });
                }}
              >
                {props => (
                  <form onSubmit={props.handleSubmit}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-3xl text-slate-50 text-center pb-5">Jsi v režimu úpravy střelce</AlertDialogTitle>
                      <AlertDialogDescription className="flex flex-col gap-3 text-xl font-bold text-slate-50 py-2" asChild>
                        <div className="flex flex-col">
                          <h4 className="text-3xl font-bold text-center">{editedScorer.firstName} {editedScorer.lastName}</h4>
                          <div className="flex gap-5 mb-5 mx-auto">
                            <div className="flex flex-col gap-3">
                              <Label>Góly</Label>
                              <Input name="goals" type="number" className="w-[150px]" min={0} onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.goals} />
                            </div>
                            <div className="flex flex-col gap-3">
                              <Label>Asistence</Label>
                              <Input name="assists" type="number" className="w-[150px]" min={0} onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.assists} />
                            </div>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-100 text-black font-bold hover:bg-slate-300 text-lg" onClick={() => setEditedScorer(null)}>Zrušit</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="submit" className="text-lg bg-amber-600 text-black font-bold hover:bg-amber-500 focus:ring-amber-600">
                          Upravit
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                )}
              </Formik>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <table>
          <thead>
            <tr>
              <th>Střelec</th>
              <th>Góly</th>
              <th>Asistence</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {scorers.map(scorer => {
              return (
                <tr key={scorer.id} className="text-center">
                  <td>{scorer.firstName} {scorer.lastName}</td>
                  <td>{scorer.goals}</td>
                  <td>{scorer.assists}</td>
                  <td className="text-xl font-semibold">
                    <Edit onClick={() => {
                      setEditedScorer({
                        id: scorer.id,
                        firstName: scorer.firstName,
                        lastName: scorer.lastName,
                        goals: scorer.goals,
                        assists: scorer.assists,
                      })
                    }} className="mx-auto cursor-pointer" size={20} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </>
    </SingleTournamentLayout>
  )
}

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  return {
    props: {
      id: context.query.id
    }
  }
};

export default MyTips;