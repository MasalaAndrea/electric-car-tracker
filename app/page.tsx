"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Zap, TrendingUp, Settings, Plus, Trash2, RotateCcw, Menu, BarChart3, List, Home } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import { InstallButton } from "@/components/install-button"

interface CarConfig {
  model: string
  batteryCapacity: number
  initialKm: number
  configDate: string
}

interface Charge {
  id: string
  date: string
  kwCharged: number
  costPerKw: number
  totalCost: number
  kmBefore: number
  kmDriven: number
  batteryPercentage: number
}

interface AppData {
  carConfig: CarConfig | null
  charges: Charge[]
}

export default function ElectricCarTracker() {
  const [data, setData] = useState<AppData>({ carConfig: null, charges: [] })
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isChargeOpen, setIsChargeOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Form states
  const [configForm, setConfigForm] = useState({
    model: "",
    batteryCapacity: "",
    initialKm: "",
  })

  const [chargeForm, setChargeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    kwCharged: "",
    costPerKw: "",
    kmBefore: "",
    kmDriven: "",
  })

  // Load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("electricCarData")
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setData(parsedData)
      if (!parsedData.carConfig) {
        setIsConfigOpen(true)
      }
    } else {
      setIsConfigOpen(true)
    }
  }, [])

  // Add this useEffect after the existing one
  useEffect(() => {
    if (data.charges.length > 0) {
      const lastCharge = data.charges[data.charges.length - 1]
      const lastKm = lastCharge.kmBefore + lastCharge.kmDriven
      setChargeForm((prev) => ({ ...prev, kmBefore: lastKm.toString() }))
    }
  }, [data.charges])

  // Save data to localStorage
  const saveData = (newData: AppData) => {
    localStorage.setItem("electricCarData", JSON.stringify(newData))
    setData(newData)
  }

  // Configure car
  const handleConfigSubmit = () => {
    if (!configForm.model || !configForm.batteryCapacity || !configForm.initialKm) {
      setError("Tutti i campi sono obbligatori")
      return
    }

    const newConfig: CarConfig = {
      model: configForm.model,
      batteryCapacity: Number.parseFloat(configForm.batteryCapacity),
      initialKm: Number.parseFloat(configForm.initialKm),
      configDate: new Date().toISOString(),
    }

    const newData = { ...data, carConfig: newConfig }
    saveData(newData)
    setIsConfigOpen(false)
    setError("")
    setConfigForm({ model: "", batteryCapacity: "", initialKm: "" })
  }

  const handleChargeSubmit = () => {
    if (!chargeForm.kwCharged || !chargeForm.kmBefore || !chargeForm.kmDriven) {
      setError("Campi obbligatori: kW caricati, km prima e km percorsi")
      return
    }

    const kwCharged = Number.parseFloat(chargeForm.kwCharged)
    const costPerKw = Number.parseFloat(chargeForm.costPerKw) || 0
    const kmBefore = Number.parseFloat(chargeForm.kmBefore)
    const kmDriven = Number.parseFloat(chargeForm.kmDriven)

    // Validation
    if (data.carConfig && kwCharged > data.carConfig.batteryCapacity) {
      setError(`I kW caricati non possono superare la capacità della batteria (${data.carConfig.batteryCapacity} kW)`)
      return
    }

    if (kmDriven <= 0) {
      setError("I km percorsi devono essere maggiori di 0")
      return
    }

    // Validation for date
    if (data.charges.length > 0) {
      const lastChargeDate = new Date(data.charges[data.charges.length - 1].date)
      const currentChargeDate = new Date(chargeForm.date)

      if (currentChargeDate < lastChargeDate) {
        setError("La data della ricarica non può essere precedente all'ultima ricarica registrata")
        return
      }
    }

    // Calculate battery percentage after charge
    const batteryPercentage = data.carConfig ? (kwCharged / data.carConfig.batteryCapacity) * 100 : 0

    const newCharge: Charge = {
      id: Date.now().toString(),
      date: chargeForm.date,
      kwCharged,
      costPerKw,
      totalCost: kwCharged * costPerKw,
      kmBefore,
      kmDriven,
      batteryPercentage,
    }

    const newData = { ...data, charges: [...data.charges, newCharge] }
    saveData(newData)
    setIsChargeOpen(false)
    setError("")

    // Set next default km
    const nextKm = kmBefore + kmDriven
    setChargeForm({
      date: new Date().toISOString().split("T")[0],
      kwCharged: "",
      costPerKw: "",
      kmBefore: nextKm.toString(),
      kmDriven: "",
    })
  }

  // Delete charge
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      const newData = { ...data, charges: data.charges.filter((c) => c.id !== deleteConfirm) }
      saveData(newData)
      setDeleteConfirm(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  // Reset app
  const resetApp = () => {
    localStorage.removeItem("electricCarData")
    setData({ carConfig: null, charges: [] })
    setIsResetOpen(false)
    setIsConfigOpen(true)
  }

  const calculateStats = () => {
    if (!data.charges.length || !data.carConfig) return null

    const totalKm = data.charges.reduce((sum, charge) => sum + charge.kmDriven, 0)
    const totalKw = data.charges.reduce((sum, charge) => sum + charge.kwCharged, 0)
    const totalCost = data.charges.reduce((sum, charge) => sum + charge.totalCost, 0)
    const consumption = totalKm > 0 ? (totalKw / totalKm) * 100 : 0

    return {
      totalKm,
      totalKw,
      totalCost,
      consumption,
      averageCostPerKm: totalKm > 0 ? totalCost / totalKm : 0,
    }
  }

  // Prepare chart data
  const getChartData = () => {
    const monthlyData: { [key: string]: { month: string; cost: number; km: number; kw: number; consumption: number } } =
      {}

    data.charges.forEach((charge) => {
      const date = new Date(charge.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("it-IT", { year: "numeric", month: "short" })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, cost: 0, km: 0, kw: 0, consumption: 0 }
      }

      monthlyData[monthKey].cost += charge.totalCost
      monthlyData[monthKey].km += charge.kmDriven
      monthlyData[monthKey].kw += charge.kwCharged
    })

    // Calculate consumption for each month
    Object.keys(monthlyData).forEach((key) => {
      const month = monthlyData[key]
      month.consumption = month.km > 0 ? (month.kw / month.km) * 100 : 0
    })

    return Object.values(monthlyData).sort((a, b) => {
      // Estrai anno e mese dal formato "gen 2024"
      const parseDate = (monthStr: string) => {
        const [month, year] = monthStr.split(" ")
        const monthNames = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]
        const monthIndex = monthNames.indexOf(month)
        return new Date(Number.parseInt(year), monthIndex)
      }

      return parseDate(a.month).getTime() - parseDate(b.month).getTime()
    })
  }

  // Aggiungi queste funzioni prima del return
  const exportData = () => {
    const dataToExport = {
      carConfig: data.carConfig,
      charges: data.charges,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `electric-car-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)

        if (importedData.carConfig && importedData.charges) {
          const newData: AppData = {
            carConfig: importedData.carConfig,
            charges: importedData.charges,
          }
          saveData(newData)
          setError("")
          alert("Dati importati con successo!")
        } else {
          setError("File non valido. Assicurati di importare un file di backup corretto.")
        }
      } catch (error) {
        setError("Errore durante l'importazione del file. Verifica che sia un file JSON valido.")
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }

  const handleConfigUpdate = () => {
    const updatedConfig = {
      ...data.carConfig!,
      model: configForm.model || data.carConfig!.model,
      batteryCapacity: configForm.batteryCapacity
        ? Number.parseFloat(configForm.batteryCapacity)
        : data.carConfig!.batteryCapacity,
      initialKm: configForm.initialKm ? Number.parseFloat(configForm.initialKm) : data.carConfig!.initialKm,
    }

    const newData = { ...data, carConfig: updatedConfig }
    saveData(newData)
    setIsConfigOpen(false)
    setError("")
    setConfigForm({ model: "", batteryCapacity: "", initialKm: "" })
  }

  // Menu items configuration
  const menuItems = [
    { value: "dashboard", label: "Dashboard", icon: Home, color: "text-blue-500" },
    { value: "charges", label: "Ricariche", icon: List, color: "text-green-500" },
    { value: "statistics", label: "Statistiche", icon: BarChart3, color: "text-purple-500" },
    { value: "settings", label: "Impostazioni", icon: Settings, color: "text-orange-500" },
  ]

  const getCurrentMenuLabel = () => {
    const currentItem = menuItems.find((item) => item.value === activeTab)
    return currentItem ? currentItem.label : "Menu"
  }

  const stats = calculateStats()
  const chartData = getChartData()

  if (!data.carConfig) {
    return (
      <div className="min-h-screen w-full">
        {/* Header con sfondo diverso */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Car className="w-12 h-12 text-blue-600" />
              <h1 className="text-2xl font-bold text-white">ChargeLog Cars EV</h1>
            </div>
          </div>
        </div>

        {/* Contenuto principale con sfondo diverso */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen pt-8">
          <div className="max-w-md mx-auto px-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Configura la tua Auto Elettrica</CardTitle>
                <CardDescription>Inserisci i dati della tua auto per iniziare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2 sm:space-y-4">
                  <Label htmlFor="model">Modello e Tipo Vettura</Label>
                  <Input
                    id="model"
                    value={configForm.model}
                    onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                    placeholder="es. Tesla Model 3"
                  />
                </div>
                <div className="space-y-2 sm:space-y-4">
                  <Label htmlFor="battery">Capacità Batteria (kW)</Label>
                  <Input
                    id="battery"
                    type="number"
                    value={configForm.batteryCapacity}
                    onChange={(e) => setConfigForm({ ...configForm, batteryCapacity: e.target.value })}
                    placeholder="es. 75"
                  />
                </div>
                <div className="space-y-2 sm:space-y-4">
                  <Label htmlFor="km">Km Attuali</Label>
                  <Input
                    id="km"
                    type="number"
                    value={configForm.initialKm}
                    onChange={(e) => setConfigForm({ ...configForm, initialKm: e.target.value })}
                    placeholder="es. 15000"
                  />
                </div>
                <Button onClick={handleConfigSubmit} className="w-full">
                  Configura Auto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      {/* Header con sfondo scuro */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">ChargeLog Cars EV</h1>
                <p className="text-sm sm:text-base text-gray-300">
                  {data.carConfig.model} • {data.carConfig.batteryCapacity} kW
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Menu Dropdown per mobile */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="w-4 h-4 mr-2" />
                      {getCurrentMenuLabel()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {menuItems.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => setActiveTab(item.value)}
                          className="flex items-center gap-2"
                        >
                          <IconComponent className={`w-4 h-4 ${item.color}`} />
                          {item.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Pulsante Nuova Ricarica - visibile solo su desktop */}
              <div className="hidden md:block">
                <Dialog open={isChargeOpen} onOpenChange={setIsChargeOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuova Ricarica
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registra Nuova Ricarica</DialogTitle>
                      <DialogDescription>Inserisci i dettagli della ricarica</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 sm:space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <div>
                        <Label htmlFor="charge-date">Data</Label>
                        <Input
                          id="charge-date"
                          type="date"
                          value={chargeForm.date}
                          onChange={(e) => setChargeForm({ ...chargeForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="kw-charged">kW Caricati *</Label>
                        <Input
                          id="kw-charged"
                          type="number"
                          step="0.1"
                          value={chargeForm.kwCharged}
                          onChange={(e) => setChargeForm({ ...chargeForm, kwCharged: e.target.value })}
                          placeholder={`Max: ${data.carConfig.batteryCapacity} kW`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost-per-kw">Costo per kW (€)</Label>
                        <Input
                          id="cost-per-kw"
                          type="number"
                          step="0.01"
                          value={chargeForm.costPerKw}
                          onChange={(e) => setChargeForm({ ...chargeForm, costPerKw: e.target.value })}
                          placeholder="0.00 per ricarica gratuita"
                        />
                      </div>
                      <div>
                        <Label htmlFor="km-before">Km Prima della Ricarica *</Label>
                        <Input
                          id="km-before"
                          type="number"
                          value={chargeForm.kmBefore}
                          onChange={(e) => setChargeForm({ ...chargeForm, kmBefore: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="km-driven">Km Percorsi *</Label>
                        <Input
                          id="km-driven"
                          type="number"
                          value={chargeForm.kmDriven}
                          onChange={(e) => setChargeForm({ ...chargeForm, kmDriven: e.target.value })}
                          placeholder="Km percorsi dall'ultima ricarica"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleChargeSubmit} className="flex-1">
                          Salva Ricarica
                        </Button>
                        <Button variant="outline" onClick={() => setIsChargeOpen(false)}>
                          Annulla
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Pulsante Nuova Ricarica per mobile - sotto il menu */}
          <div className="md:hidden mt-3">
            <Dialog open={isChargeOpen} onOpenChange={setIsChargeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuova Ricarica
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuova Ricarica</DialogTitle>
                  <DialogDescription>Inserisci i dettagli della ricarica</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 sm:space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div>
                    <Label htmlFor="charge-date-mobile">Data</Label>
                    <Input
                      id="charge-date-mobile"
                      type="date"
                      value={chargeForm.date}
                      onChange={(e) => setChargeForm({ ...chargeForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kw-charged-mobile">kW Caricati *</Label>
                    <Input
                      id="kw-charged-mobile"
                      type="number"
                      step="0.1"
                      value={chargeForm.kwCharged}
                      onChange={(e) => setChargeForm({ ...chargeForm, kwCharged: e.target.value })}
                      placeholder={`Max: ${data.carConfig.batteryCapacity} kW`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-per-kw-mobile">Costo per kW (€)</Label>
                    <Input
                      id="cost-per-kw-mobile"
                      type="number"
                      step="0.01"
                      value={chargeForm.costPerKw}
                      onChange={(e) => setChargeForm({ ...chargeForm, costPerKw: e.target.value })}
                      placeholder="0.00 per ricarica gratuita"
                    />
                  </div>
                  <div>
                    <Label htmlFor="km-before-mobile">Km Prima della Ricarica *</Label>
                    <Input
                      id="km-before-mobile"
                      type="number"
                      value={chargeForm.kmBefore}
                      onChange={(e) => setChargeForm({ ...chargeForm, kmBefore: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="km-driven-mobile">Km Percorsi *</Label>
                    <Input
                      id="km-driven-mobile"
                      type="number"
                      value={chargeForm.kmDriven}
                      onChange={(e) => setChargeForm({ ...chargeForm, kmDriven: e.target.value })}
                      placeholder="Km percorsi dall'ultima ricarica"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleChargeSubmit} className="flex-1">
                      Salva Ricarica
                    </Button>
                    <Button variant="outline" onClick={() => setIsChargeOpen(false)}>
                      Annulla
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Contenuto principale con sfondo chiaro */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="w-full p-2 sm:p-4">
          <div className="max-w-6xl mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-6 w-full">
              {/* Tab List - nascosto su mobile, visibile su desktop */}
              <TabsList className="hidden md:grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="charges">Ricariche</TabsTrigger>
                <TabsTrigger value="statistics">Statistiche</TabsTrigger>
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6 w-full">
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 w-full">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Km Totali</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="py-1 px-2 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                          {stats.totalKm.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">kW Caricati</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="py-1 px-2 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats.totalKw.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Costo Totale</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="py-1 px-2 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-red-600">€{stats.totalCost.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Consumo Medio</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="py-1 px-2 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {stats.consumption.toFixed(1)} kW/100km
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Costo per Km</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="py-1 px-2 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-teal-600">
                          €{stats.averageCostPerKm.toFixed(3)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Combined Chart */}
                {chartData.length > 0 ? (
                  <Card className="w-full bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200">
                    <CardHeader className="pb-1 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">Costi e kW Caricati Mensili</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis dataKey="month" stroke="#4f46e5" />
                          <YAxis yAxisId="left" stroke="#3b82f6" />
                          <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === "Costi (€)") {
                                return [`€${Number(value).toFixed(2)}`, name]
                              }
                              return [`${Number(value).toFixed(1)} kW`, name]
                            }}
                            contentStyle={{
                              backgroundColor: "#f8fafc",
                              border: "2px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="cost" fill="#3b82f6" name="Costi (€)" />
                          <Bar yAxisId="right" dataKey="kw" fill="#8b5cf6" name="kW Caricati" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="w-full">
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">Aggiungi alcune ricariche per visualizzare i grafici</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="charges" className="space-y-6 w-full">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Tutte le Ricariche</CardTitle>
                    <CardDescription>Gestisci le tue ricariche registrate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.charges.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nessuna ricarica registrata</p>
                    ) : (
                      <div className="space-y-3">
                        {data.charges.map((charge) => (
                          <div
                            key={charge.id}
                            className="flex items-start justify-between p-2 sm:p-4 border rounded-lg w-full"
                          >
                            <div className="flex-1 pr-2">
                              <div className="space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                  <div className="mb-1 sm:mb-0">
                                    <p className="font-medium">{new Date(charge.date).toLocaleDateString("it-IT")}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      {charge.kwCharged} kW • {charge.batteryPercentage.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div className="mb-1 sm:mb-0">
                                    <p className="text-xs sm:text-sm">
                                      Km: {charge.kmBefore.toLocaleString()} (+{charge.kmDriven.toLocaleString()})
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      Totale: {(charge.kmBefore + charge.kmDriven).toLocaleString()} km
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">€{charge.totalCost.toFixed(2)}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      €{charge.costPerKw.toFixed(3)}/kW
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(charge.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Conferma Eliminazione</DialogTitle>
                      <DialogDescription>
                        Sei sicuro di voler eliminare questa ricarica? Questa azione non può essere annullata.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={confirmDelete} className="flex-1">
                        Elimina
                      </Button>
                      <Button variant="outline" onClick={cancelDelete}>
                        Annulla
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="statistics" className="space-y-3 sm:space-y-6 w-full">
                {chartData.length > 0 ? (
                  <>
                    <Card className="w-full bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                      <CardHeader>
                        <CardTitle>Costi Mensili</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#fed7d7" />
                            <XAxis dataKey="month" stroke="#dc2626" />
                            <YAxis stroke="#dc2626" />
                            <Tooltip
                              formatter={(value) => [`€${Number(value).toFixed(2)}`, "Costo"]}
                              contentStyle={{
                                backgroundColor: "#fef2f2",
                                border: "2px solid #fecaca",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="cost">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#dc2626" : "#f97316"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                      <CardHeader className="pb-1 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">Km e Consumo Mensili</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                            <XAxis dataKey="month" stroke="#059669" />
                            <YAxis yAxisId="left" stroke="#10b981" />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "Km percorsi") {
                                  return [`${Number(value).toLocaleString()} km`, name]
                                }
                                return [`${Number(value).toFixed(1)} kW/100km`, name]
                              }}
                              contentStyle={{
                                backgroundColor: "#f0fdf4",
                                border: "2px solid #bbf7d0",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="km" fill="#10b981" name="Km percorsi" />
                            <Bar yAxisId="right" dataKey="consumption" fill="#f59e0b" name="Consumo kW/100km" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="w-full bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                      <CardHeader className="pb-1 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">kW Caricati Mensili</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                            <XAxis dataKey="month" stroke="#7c3aed" />
                            <YAxis stroke="#8b5cf6" />
                            <Tooltip
                              formatter={(value) => [`${Number(value).toFixed(1)} kW`, "Energia"]}
                              contentStyle={{
                                backgroundColor: "#faf5ff",
                                border: "2px solid #ddd6fe",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="kw">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#06b6d4"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="w-full">
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">Aggiungi alcune ricariche per visualizzare le statistiche</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="settings" className="space-y-3 sm:space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Gestione Dati */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Gestione Dati
                      </CardTitle>
                      <CardDescription>Importa o esporta i tuoi dati</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Esporta Dati</Label>
                        <p className="text-sm text-muted-foreground">Scarica tutti i tuoi dati in formato JSON</p>
                        <Button onClick={exportData} variant="outline" className="w-full">
                          Esporta Dati
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Importa Dati</Label>
                        <p className="text-sm text-muted-foreground">Carica dati da un file di backup</p>
                        <Input type="file" accept=".json" onChange={handleImportData} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configurazione Vettura */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5 text-green-500" />
                        Configurazione Vettura
                      </CardTitle>
                      <CardDescription>Modifica i dati della tua auto elettrica</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Modello Attuale</Label>
                        <p className="text-sm text-muted-foreground">{data.carConfig.model}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Capacità Batteria</Label>
                        <p className="text-sm text-muted-foreground">{data.carConfig.batteryCapacity} kW</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Km Iniziali</Label>
                        <p className="text-sm text-muted-foreground">{data.carConfig.initialKm.toLocaleString()}</p>
                      </div>
                      <Button onClick={() => setIsConfigOpen(true)} className="w-full">
                        Modifica Configurazione
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Statistiche App */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        Statistiche Applicazione
                      </CardTitle>
                      <CardDescription>Informazioni sui tuoi dati</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="text-center p-1 sm:p-2">
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{data.charges.length}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Ricariche Totali</p>
                        </div>
                        <div className="text-center p-1 sm:p-2">
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {data.carConfig.configDate
                              ? Math.floor(
                                  (new Date().getTime() - new Date(data.carConfig.configDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                )
                              : 0}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Giorni di Utilizzo</p>
                        </div>
                        <div className="text-center p-1 sm:p-2">
                          <p className="text-xl sm:text-2xl font-bold text-orange-600">
                            {data.charges.length > 0 ? Math.round((stats?.totalKm || 0) / data.charges.length) : 0}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Km Medi per Ricarica</p>
                        </div>
                        <div className="text-center p-1 sm:p-2">
                          <p className="text-xl sm:text-2xl font-bold text-purple-600">
                            {data.charges.length > 0
                              ? ((stats?.totalCost || 0) / data.charges.length).toFixed(2)
                              : "0.00"}
                            €
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Costo Medio per Ricarica</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reset Applicazione */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-red-500" />
                        Reset Applicazione
                      </CardTitle>
                      <CardDescription>Elimina tutti i dati e ricomincia da capo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-destructive">Attenzione</Label>
                        <p className="text-sm text-muted-foreground">
                          Questa azione eliminerà definitivamente tutti i dati dell'applicazione.
                        </p>
                      </div>
                      <Button onClick={() => setIsResetOpen(true)} variant="destructive" className="w-full">
                        Reset Completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Footer con crediti */}
                <Card className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                  <CardContent className="text-center py-4">
                    <p className="text-sm text-gray-600 font-medium">
                      Created by <span className="text-blue-600 font-semibold">Andrea Masala</span>
                    </p>
                  </CardContent>
                </Card>

                {/* Dialog per configurazione e reset rimangono uguali */}
                <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifica Configurazione Auto</DialogTitle>
                      <DialogDescription>Aggiorna i dati della tua auto elettrica</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 sm:space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <div>
                        <Label htmlFor="model-edit">Modello e Tipo Vettura</Label>
                        <Input
                          id="model-edit"
                          value={configForm.model || data.carConfig.model}
                          onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                          placeholder="es. Tesla Model 3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="battery-edit">Capacità Batteria (kW)</Label>
                        <Input
                          id="battery-edit"
                          type="number"
                          value={configForm.batteryCapacity || data.carConfig.batteryCapacity}
                          onChange={(e) => setConfigForm({ ...configForm, batteryCapacity: e.target.value })}
                          placeholder="es. 75"
                        />
                      </div>
                      <div>
                        <Label htmlFor="km-edit">Km Iniziali</Label>
                        <Input
                          id="km-edit"
                          type="number"
                          value={configForm.initialKm || data.carConfig.initialKm}
                          onChange={(e) => setConfigForm({ ...configForm, initialKm: e.target.value })}
                          placeholder="es. 15000"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleConfigUpdate} className="flex-1">
                          Salva Modifiche
                        </Button>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                          Annulla
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Applicazione</DialogTitle>
                      <DialogDescription>Questa azione cancellerà tutti i dati. Sei sicuro?</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={resetApp} className="flex-1">
                        Conferma Reset
                      </Button>
                      <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                        Annulla
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <InstallButton />
    </div>
  )
}
