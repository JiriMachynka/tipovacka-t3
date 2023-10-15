import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const InfoTooltip = ({ children }: React.PropsWithChildren) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info size={20} className="stroke-slate-50"  />
        </TooltipTrigger>
        <TooltipContent className="flex flex-col">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
export default InfoTooltip;