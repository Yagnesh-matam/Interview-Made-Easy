const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');

dotenv.config();

const combinedComprehensiveDataset = [
    // =========================================================================
    // =========================== JAVA DATASET ================================
    // =========================================================================
    {
        topic: 'Java',
        question: `Why is Java a platform-independent language? Explain the role of JVM.`,
        answer: `Java is platform-independent because source code (.java) is compiled into an intermediate bytecode (.class) rather than native machine language. The Java Virtual Machine (JVM) acts as an abstraction engine that reads this bytecode and translates it into specific native machine instructions at runtime. Thus, while the bytecode is universally identical, the JVM itself is platform-dependent.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Why is Java not a pure object-oriented language? What features prevent it from being 100% OOP?`,
        answer: `Java is not a pure object-oriented language because it supports primitive data types (like int, float, char, boolean) which are stored directly on the stack rather than being instantiated as true objects. Additionally, the use of static variables and methods allows data and behavior to exist independently of an object instance, violating pure OOP principles.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between Heap and Stack memory in Java. How does Java utilize each for variable storage and method execution?`,
        answer: `Stack memory is used for sequential method execution frames and temporary local primitive variables/object reference pointers. It follows Last-In-First-Out (LIFO) sorting, allocates memory statically at compile-time, and clears automatically when a method finishes. Heap memory is used for dynamic allocation of true objects and instance variables. It is accessible globally across all running threads and is cleaned asynchronously by the Garbage Collector.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between equals() method and == operator in Java. Provide an example where they differ.`,
        answer: `The "==" operator performs primitive value matching or reference equality checking (verifying if both pointers point to the exact same memory address on the Heap). The "equals()" method is a structural method belonging to Object that can be overridden to compare character contents or values. For example: String s1 = new String("test"); String s2 = new String("test"); Here, s1 == s2 is false, but s1.equals(s2) evaluates to true.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Explain method overloading vs method overriding with examples. Can static methods be overloaded? Can they be overridden?`,
        answer: `Method Overloading defines multiple methods in the same class with identical names but different parameter signatures (resolved at compile-time). Method Overriding redefines a inherited method in a subclass with the same signature (resolved at runtime). Static methods can be overloaded normally, but they cannot be overridden because method overriding relies on dynamic runtime binding of object instances, whereas static structures bind at compile-time (Method Hiding).`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Explain the use of final keyword with variables, methods, and classes. Also differentiate between final, finally, and finalize().`,
        answer: `The "final" keyword locks implementation: final variables cannot be reassigned, final methods cannot be overridden, and final classes cannot be extended. "finally" is a block tied to try-catch structures that executes code regardless of whether an exception occurs. "finalize()" is a protected method of the Object class called by the Garbage Collector immediately before an object is destroyed to release underlying resources.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between constructor and method in Java. What is constructor overloading? Define copy constructor in Java.`,
        answer: `A constructor initializes a newly allocated object instance, shares the identical name of the class, and lacks a return type definition. A method exposes object behaviors and requires a clear return mapping. Constructor overloading provides multiple initialization options with varying argument sets. A copy constructor creates a duplicate object by passing an existing class object instance parameter (e.g., Student(Student s)).`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What are instance variables and local variables? What are the default values assigned to variables and instances in Java?`,
        answer: `Instance variables are declared inside a class but outside methods; they exist on the Heap as part of the object and receive automatic default values (e.g., 0 for int, null for Objects). Local variables are declared directly inside a specific block or method; they live briefly on the Stack during execution, do not receive default values, and must be explicitly initialized before use.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is data encapsulation? How does Java achieve it?`,
        answer: `Data encapsulation is an OOP pillar that bundles data variables and class operations into a single cohesive unit while hiding internal state details. Java achieves this by making variables "private" (preventing direct external tampering) and exposing controlled modification lanes through public "getter" and "setter" methods.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is the difference between String, StringBuffer, and StringBuilder? Which should be preferred when many updates are required?`,
        answer: `String objects are immutable; modifying them spawns new objects in memory. StringBuffer and StringBuilder are mutable, modifying characters inside a shared buffer array without allocations. StringBuffer synchronized methods are entirely thread-safe but introduce locking overhead. StringBuilder is non-synchronized and faster. For loops or heavy updates on a single thread, preferred choice is StringBuilder.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Why are strings immutable in Java? (Apart from security aspects)`,
        answer: `Beyond security parameters, string immutability allows the JVM to share string resources via the String Constant Pool, reducing memory consumption. It guarantees that hash codes remain constant, allowing safe caching inside HashMaps, and ensures complete thread safety across parallel concurrent worker threads without manual synchronization overhead.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is a singleton class? How to implement it in Java?`,
        answer: `A Singleton class restricts instantiation, ensuring that only one specific object instance can ever exist inside the running JVM application scope. It is implemented by hiding the standard constructor with a private accessibility modifier and exposing a public static initialization route (e.g., getInstance()) that instantiates the class only upon the initial evaluation call.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Differences between interfaces and abstract classes. When would you use each?`,
        answer: `Interfaces establish an absolute behavior contract; prior to modern iterations, they could only hold abstract methods and support multiple inheritance constraints. Abstract classes can hold full operational methods, maintain private state fields, and support constructors. Use an abstract class to build a shared foundation for closely related child elements; use an interface to define a decoupled behavior capability across distinct systems.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between HashMap and HashTable in Java.`,
        answer: `HashMap is unsynchronized, fast, allows a single null key along with multiple null value attributes, and should be preferred in single-threaded spaces. HashTable is an obsolete legacy collection; its entire method tree is heavily synchronized, introducing performance penalties, and it forbids any null elements.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between HashSet and TreeSet.`,
        answer: `HashSet stores values using an internal hashing algorithm; it provides high-performance O(1) time complexity search, insert, and delete operations but maintains no constant indexing order. TreeSet is backed by a balanced Red-Black tree; it sorts incoming elements naturally or via custom Comparators, incurring an O(log n) performance cost.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Explain JVM, JRE, and JDK. What is a ClassLoader? What is JIT compiler?`,
        answer: `JDK is the development kit containing compilers, tools, and libraries. JRE is the runtime workspace providing active libraries paired with the JVM. JVM executes bytecode. The ClassLoader is a subsystem that loads compiled bytecode (.class files) into memory. The JIT (Just-In-Time) compiler dynamically monitors bytecode execution frequencies and compiles hot code segments into native machine code to maximize processing performance.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between throw and throws keywords.`,
        answer: `The "throw" keyword is explicitly used inside a method body to instantiate and trigger an active exception object instance. The "throws" keyword is appended to a method signature declaration to notify calling programs that this specific block delegates potential checked exceptions upward to be handled in parent call frames.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is the difference between program and process? Explain Java thread lifecycle.`,
        answer: `A program is a static execution blueprint resting on storage. A process is an active instance of that program running inside isolated system memory. A Thread is a lightweight worker thread inside that process. The Java Thread lifecycle stages include: NEW, RUNNABLE (active processing allocation), BLOCKED (waiting for monitor locks), WAITING, TIMED_WAITING, and TERMINATED.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What are the different ways to create and use threads in Java? What are thread priorities and what is the default priority?`,
        answer: `Threads are created by extending the Thread class or implementing the Runnable interface (or Callable for returning future indicators). Thread priorities scale from 1 (MIN_PRIORITY) to 10 (MAX_PRIORITY) to hint thread scheduling order parameters to the host system CPU. The default allocation value is 5 (NORM_PRIORITY).`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Does Java work as "pass by value" or "pass by reference"? Explain with example.`,
        answer: `Java operates strictly as "pass by value." When an object reference is passed to a method, a copy of the memory address pointer value is created and passed into the method frame stack. Modifying an object variable changes the original object on the Heap; however, reassigning the reference pointer variable inside the method context does not change the original pointer address outside.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is the "IS-A" relationship and "HAS-A" relationship in OOP? Explain composition vs aggregation.`,
        answer: `"IS-A" represents structural class inheritance (e.g., Dog extends Animal). "HAS-A" represents instance composition, where a class holds references to another object. Composition is a strict relationship where the child object lifecycle is completely tied to the parent class (e.g., a Room cannot exist without a House). Aggregation is a looser relationship where child objects can exist independently (e.g., a Professor inside a University).`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Can the main method be overloaded? Why is the main method static? What happens if static modifier is not included?`,
        answer: `Yes, the main method can be overloaded normally like any other method; however, the JVM will only search for and execute the method signature that takes a string array parameter as its starting execution context: public static void main(String[] args). All other main variations act as standard utility functions.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is object cloning? Explain shallow copy vs deep copy in Java.`,
        answer: `Object cloning creates an exact duplicate clone resource of an active instance. A Shallow copy duplicates primitive values and copies references to nested objects; if a child object changes, it affects both instances. A Deep copy recursively clones all nested child objects, generating completely isolated instances on the Heap.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is garbage collection? What part of memory (Stack or Heap) is cleaned? What are ways to make objects eligible for GC?`,
        answer: `Garbage Collection is an automated management thread that sweeps away unreferenced, dead objects to prevent out-of-memory errors. It targets only Heap storage memory. Objects become eligible for collection when their active reference chains break—either by setting pointers to null, reassigning references, or when objects exit their execution scope.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is the difference between >> and >>> operators?`,
        answer: `The ">>" operator is an arithmetic bitwise right-shift that preserves the original sign bit (shifting in 0s for positive values, 1s for negative values). The ">>>" operator is a logical right-shift; it pads incoming high-order bits strictly with zeros regardless of whether the original value was positive or negative, transforming negative entries into large positive values.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Explain the difference between creating a String using new() vs string literal.`,
        answer: `Creating a string literal (e.g., String s = "abc") checks the String Constant Pool inside the Heap first; if it exists, it returns the existing reference pointer. Instantiating via new() (e.g., new String("abc")) bypasses this check, forcing the allocation of a completely separate, brand new string object on the main non-pool Heap region.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Why is synchronization necessary? Explain with example.`,
        answer: `Synchronization regulates parallel concurrent thread access to shared mutable critical sections, preventing race conditions or corrupted object states. For instance, if two parallel threads attempt to increment a shared balance counter simultaneously without synchronization, both could read the same initial value, causing one execution update to be lost.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is a memory leak in Java? Can exceeding memory limit happen despite garbage collector?`,
        answer: `A memory leak occurs when a program retains reference pointers to unused objects, preventing the Garbage Collector from freeing their memory. Yes, an OutOfMemoryError can occur if live references (like static collections or unclosed database connections) accumulate objects faster than the heap can scale, regardless of GC activity.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Explain the difference between throw and throws. How does exception propagate in code?`,
        answer: `"throw" triggers an exception instance explicitly. "throws" outlines exceptions that a method might pass upward. Uncaught runtime exceptions propagate automatically up the method execution call stack, searching for a matching try-catch block; if none are found after hitting the root main() frame, the current thread terminates.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Can a single try block have multiple catch blocks? Explain. Is it mandatory for a catch block to follow a try block?`,
        answer: `Yes, a try block can link to multiple specialized catch blocks to handle different exceptions uniquely, provided that specific subclasses are caught before parent exception classes. No, a catch block is not strictly mandatory if the try block is followed by a valid "finally" block.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Can the finally block not execute? List the cases. Will finally execute if System.exit(0) is called?`,
        answer: `The finally block will not execute if the JVM crashes, the host operating system kills the process, or a line calls System.exit(0) before entering the finally block. If a return statement is triggered within the try block, the finally block will still execute before returning control to the calling function.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What is a Comparator in Java? How is it different from Comparable?`,
        answer: `Comparable is an interface implemented inside a domain class to define its natural sorting order via the "compareTo()" method. Comparator is a separate, decoupled utility interface used to implement alternative or multiple custom sorting strategies using the "compare()" method without modifying the target data class.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `What are marker interfaces in Java? Give examples.`,
        answer: `A marker interface is an empty interface containing no method signatures or variables. It acts as a metadata tag for the JVM and compiler to grant special capabilities to an object. Examples include "java.io.Serializable" and "java.lang.Cloneable".`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Why is the character array preferred over String for storing confidential information like passwords?`,
        answer: `Strings are immutable and stored in the String Constant Pool, meaning they remain in memory for an unpredictable duration until garbage collection runs. A character array can be explicitly overwritten with zeros immediately after verification, wiping the sensitive data from memory and minimizing exposure to heap dumps.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `Difference between ArrayList and LinkedList? Why is remove method faster in LinkedList? How does ArrayList size grow dynamically?`,
        answer: `ArrayList is backed by a continuous primitive array providing fast O(1) random access; LinkedList is a chain of pointer nodes optimized for fast sequential edits. Removing a node from a LinkedList is faster because it only requires changing two adjacent pointer references rather than shifting remaining elements down an array. An ArrayList grows dynamically by allocating a new array at 1.5x capacity and copying elements over.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Java',
        question: `[Google Tech Assessment] Write code for an infinite loop using for and while loops.`,
        answer: `Infinite loops are declared by omitting halting conditions:\n\n\`\`\`java\n// For variant\nfor (;;) {\n    System.out.println("Loop Running");\n}\n\n// While variant\nwhile (true) {\n    System.out.println("Loop Running");\n}\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Google'
    },
    {
        topic: 'Java',
        question: `[Microsoft Technical Round] Predict the exact output and runtime mechanics of this block:\n\n\`\`\`java\ntry {\n    System.out.print("A");\n    int x = 10/0;\n} catch(ArithmeticException e) {\n    System.out.print("B");\n} finally {\n    System.out.print("C");\n}\n\`\`\``,
        answer: `The exact output is ABC. Execution enters the try block and prints "A". Dividing by zero throws an ArithmeticException, which stops execution in the try block and jumps to the matching catch block, printing "B". Finally, the mandatory finally block executes, printing "C".`,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Microsoft'
    },
    {
        topic: 'Java',
        question: `[Amazon Coding Assessment] Determine if this compiles and predict output:\n\n\`\`\`java\nclass Parent { static void display() { System.out.println("Parent"); } }\nclass Child extends Parent { static void display() { System.out.println("Child"); } }\n// Execution:\nParent p = new Child(); p.display();\n\`\`\``,
        answer: `Yes, this compiles perfectly. The output is "Parent". This behavior is due to Method Hiding rather than overriding; static methods bind at compile-time based on the reference variable type (Parent) rather than the runtime object instance type (Child).`,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Amazon'
    },
    {
        topic: 'Java',
        question: `[TCS Ninja Track Assessment] What happens if there are multiple main methods inside one class?`,
        answer: `The program compiles successfully. Java supports method overloading on the main method; however, the JVM will only search for and execute the method signature that takes a string array parameter as its starting execution context: public static void main(String[] args). All other main variations act as standard utility functions.`,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'TCS'
    },
    {
        topic: 'Java',
        question: `[Deloitte Consulting Case Assessment] Can you call a constructor inside another constructor? Show code demonstrating constructor chaining.`,
        answer: `Yes, this is achieved using the "this()" keyword, which must be placed on the very first line of the calling constructor to preserve initialization flow:\n\n\`\`\`java\nclass Bike {\n    Bike() {\n        this("Default Brand");\n    }\n    Bike(String brand) {\n        System.out.println("Brand: " + brand);\n    }\n}\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Deloitte'
    },
    {
        topic: 'Java',
        question: `[Infosys Edge Assessment] Write a program demonstrating nested checked exception propagation upward across call stacks.`,
        answer: `Exceptions propagate up call stacks unless intercepted by a matching catch block:\n\n\`\`\`java\nclass Engine {\n    void methodC() throws Exception { throw new Exception("Core Alert"); }\n    void methodB() throws Exception { methodC(); }\n    void methodA() {\n        try { methodB(); }\n        catch(Exception e) { System.out.println("Caught: " + e.getMessage()); }\n    }\n}\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Infosys'
    },
    {
        topic: 'Java',
        question: `[Google Core Engineering] Write a thread-safe singleton class using double-checked locking.`,
        answer: `Double-checked locking minimizes synchronization overhead by checking instantiation requirements before acquiring monitor locks:\n\n\`\`\`java\npublic class SafeSingleton {\n    private static volatile SafeSingleton instance;\n    private SafeSingleton() {}\n    public static SafeSingleton getInstance() {\n        if (instance == null) {\n            synchronized (SafeSingleton.class) {\n                if (instance == null) { instance = new SafeSingleton(); }\n            }\n        }\n        return instance;\n    }\n}\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Google'
    },
    {
        topic: 'Java',
        question: `[Accenture Architecture Assessment] Write code to prove that String is immutable while StringBuffer/StringBuilder are mutable.`,
        answer: `\`\`\`java\nString s = "Hello";\ns.concat("World");\nSystem.out.println(s); // Outputs "Hello" due to immutability\n\nStringBuilder sb = new StringBuilder("Hello");\nsb.append("World");\nSystem.out.println(sb.toString()); // Outputs "HelloWorld" reflecting mutability\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Accenture'
    },
    {
        topic: 'Java',
        question: `[Wipro Elite Assessment] Create a custom checked exception called InsufficientFundsException and use it in a BankAccount class with a withdraw method.`,
        answer: `\`\`\`java\nclass InsufficientFundsException extends Exception {\n    public InsufficientFundsException(String msg) { super(msg); }\n}\nclass BankAccount {\n    private double balance = 100;\n    public void withdraw(double amt) throws InsufficientFundsException {\n        if (amt > balance) throw new InsufficientFundsException("Balance low");\n        balance -= amt;\n    }\n}\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Wipro'
    },
    {
        topic: 'Java',
        question: `[Capgemini Technical Round] Write a simple producer-consumer program using wait() and notify() with a shared queue.`,
        answer: `\`\`\`java\nclass Storage {\n    private int item; private boolean empty = true;\n    public synchronized void produce(int val) throws Exception {\n        while(!empty) wait(); item = val; empty = false; notify();\n    }\n    public synchronized int consume() throws Exception {\n        while(empty) wait(); empty = true; notify(); return item;\n    }\n}\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Capgemini'
    },
    {
        topic: 'Java',
        question: `[Cognizant GenC Assessment] Write code to demonstrate storing duplicate keys in HashMap vs storing duplicate elements in HashSet.`,
        answer: `\`\`\`java\nHashMap<String, Integer> map = new HashMap<>();\nmap.put("A", 1); map.put("A", 2); // Overwrites key "A" to value 2\n\nHashSet<String> set = new HashSet<>();\nset.add("B"); boolean flag = set.add("B"); // Returns false, duplicate rejected\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Cognizant'
    },
    {
        topic: 'Java',
        question: `[Microsoft Core Track] Write code to show how an ArrayList grows dynamically beyond initial capacity parameters.`,
        answer: `\`\`\`java\nArrayList<Integer> list = new ArrayList<>(2);\nlist.add(1); list.add(2);\nlist.add(3); // Triggers internal dynamic scale expansion array copy\nSystem.out.println(list.size()); // Outputs 3\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Microsoft'
    },
    {
        topic: 'Java',
        question: `[Amazon Web Services Round] Create a class Student with an Address object to demonstrate shallow copy vs deep copy.`,
        answer: `\`\`\`java\nclass Address { String city; }\nclass Student implements Cloneable {\n    Address addr;\n    // Shallow Copy\n    public Object clone() throws CloneNotSupportedException { return super.clone(); }\n    // Deep Copy\n    public Student deepCopy() {\n        Student s = new Student(); s.addr = new Address();\n        s.addr.city = this.addr.city; return s;\n    }\n}\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Amazon'
    },
    {
        topic: 'Java',
        question: `[Google Cloud Round] Write a program that creates a deadlock scenario with two threads and two resources.`,
        answer: `\`\`\`java\n// Thread 1 locks Res1 then waits for Res2\n// Thread 2 locks Res2 then waits for Res1\nsynchronized(res1) {\n    Thread.sleep(50);\n    synchronized(res2) {}\n}\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Google'
    },
    {
        topic: 'Java',
        question: `[TCS Digital Assessment] Write code creating objects and demonstrate 3 ways to make them eligible for garbage collection.`,
        answer: `\`\`\`java\nStudent s1 = new Student(); s1 = null; // 1. Nullifying references\n\nStudent s2 = new Student();\nStudent s3 = new Student(); s2 = s3; // 2. Reassigning reference pointer\n\nvoid scope() { Student s4 = new Student(); } // 3. Out of scope exit\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'TCS'
    },

    // =========================================================================
    // ========================== PYTHON DATASET ===============================
    // =========================================================================
    {
        topic: 'Python',
        question: `What is Python? What makes it a dynamically typed and interpreted language?`,
        answer: `Python is a high-level, general-purpose, interpreted programming language. It is "dynamically typed" because variable types are evaluated and bound at runtime rather than compile-time; you do not need to explicitly declare type tags (e.g., x = 5). It is "interpreted" because Python source code is executed line-by-line by the Python interpreter (using an intermediate compilation to bytecode .pyc files) rather than pre-compiling into machine code.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is PEP 8 and why is it important? Give 3 key naming conventions from PEP 8.`,
        answer: `PEP 8 (Python Enhancement Proposal 8) is the official styling and formatting manual for Python code. It ensures that code written by different developers remains consistent and highly readable. Three key naming conventions are:\n1. Functions and variable names should use snake_case.\n2. Class names should use PascalCase (CamelCase starting with a capital).\n3. Constants should be declared in ALL_CAPS with underscores.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are the common built-in data types in Python? Explain mutable vs immutable types.`,
        answer: `Python's built-in types include numeric types (int, float, complex), sequences (list, tuple, range), mappings (dict), sets (set, frozenset), and strings (str).\nMutable types (lists, dicts, sets) allow you to change their content in-place without generating a new object address on the Heap.\nImmutable types (ints, floats, strings, tuples) cannot be altered after creation; modifying them forces Python to generate a brand new object in memory.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between lists and tuples. When would you use each?`,
        answer: `Lists are mutable sequences declared with square brackets [1, 2], allowing element updates, appends, and deletes. Tuples are immutable sequences declared with parentheses (1, 2) that cannot be altered after creation. Use a list when your data collection needs to grow or change dynamically during runtime. Use a tuple when storing fixed, write-protected datasets (like coordinate pairs) to protect data from accidental modification and gain performance optimizations.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are break, continue, and pass? Provide an example of each.`,
        answer: `- "break" immediately terminates the active loop and jumps out of it.\n- "continue" skips the remainder of the current loop iteration and proceeds to the next cycle.\n- "pass" is a null operational placeholder used to maintain valid syntactical structures where code is required but no action is needed (e.g., class Empty: pass).`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is self in Python? What is __init__? How do they work together?`,
        answer: `- "self" represents the active, specific instance of the class currently being created or modified; it acts as a pointer to the object's instance variable dictionary.\n- "__init__" is the initialization method (the constructor) that is automatically executed when a new class instance is built.\nThey work together because __init__ accepts "self" as its first parameter to bind instance attributes (e.g., self.name = name) directly onto the newly constructed object memory space.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are modules and packages? Differentiate between a package and a module.`,
        answer: `A module is a single Python file (.py) containing classes, functions, and variables designed to be imported. A package is a structural directory containing multiple modules and a mandatory initialization file (named __init__.py). In short, a module is a single code file, while a package is a folder containing multiple module files organized hierarchically.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are global, protected, and private attributes in Python? How do name mangling (__var) work?`,
        answer: `- Global attributes are declared outside classes and are accessible anywhere inside the module.\n- Protected attributes start with a single underscore (e.g., _var); they act as a visual hint to developers that the variable should not be accessed outside the class scope (though Python does not strictly enforce this).\n- Private attributes start with a double underscore (e.g., __var). Python strictly hides these by performing Name Mangling, dynamically rewriting the variable name to "_ClassName__var" to prevent accidental direct subclass modification.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is slicing in Python? Write code to reverse a string and extract every 2nd element from a list.`,
        answer: `Slicing is a technique to extract segments from a sequence using syntax sequence[start:stop:step].\nTo reverse a string:\n\`\`\`python\nreversed_str = text[::-1]\n\`\`\`\nTo extract every second element from a list:\n\`\`\`python\nsub_list = numbers[::2]\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is docstring in Python? How is it different from comments?`,
        answer: `A docstring is a triple-quoted string block ("""doc""") placed at the very top of classes, methods, or modules to document their behavior. Unlike standard comments (# comments), docstrings are parsed by the compiler and remain attached to the object as metadata, meaning they can be evaluated at runtime via the __doc__ attribute or the help() utility.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between Python arrays and lists. When to use arrays?`,
        answer: `Python lists can store heterogeneous data types concurrently, are highly dynamic, and introduce overhead because they store references to object boxes. Python arrays (imported via "array" or "numpy") are homogeneous, requiring all elements to share an identical primitive data type. Use arrays when storing large, numerical datasets to achieve efficient memory layout and high-speed vectorized operations.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `How is memory managed in Python? What is garbage collection?`,
        answer: `Python memory is managed dynamically through a private Heap space where all objects and data structures reside. The Python runtime manages this heap automatically using two processes:\n1. Reference Counting: Each object tracks how many references point to it; once this count hits zero, the object is immediately destroyed.\n2. Garbage Collector (Generational GC): Resolves cyclic reference loops (where two unused objects point to each other) by scanning memory allocations using three age-based generations.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are namespaces and scope in Python? Explain LEGB rule (Local, Enclosing, Global, Built-in).`,
        answer: `A namespace is a container (implemented as a dictionary) mapping variable names to their corresponding object instances. Scope is the region of code where a namespace is directly accessible. Python resolves variable lookups sequentially using the LEGB rule:\n1. Local (L): Variables declared inside the active function.\n2. Enclosing (E): Variables inside nested outer functions.\n3. Global (G): Variables declared at the root module level.\n4. Built-in (B): Python's native keywords and system exceptions.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are decorators in Python? Write a decorator that measures function execution time.`,
        answer: `A decorator is a design pattern that allows you to wrap and modify the behavior of a function or class without permanently changing its source code. It takes a function as an argument, extends its execution inside a wrapper, and returns the modified wrapper:\n\n\`\`\`python\nimport time\ndef timer_decorator(func):\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f"Time: {time.time() - start}s")\n        return result\n    return wrapper\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are dict and list comprehensions? Write a comprehension to create a dictionary of squares for numbers 1-10.`,
        answer: `Comprehensions are syntactical shortcuts that allow you to construct lists or dictionaries from existing iterables using inline loops and optional filters. It replaces verbose multi-line loops.\nTo generate a dictionary of squares for numbers 1 to 10:\n\`\`\`python\nsquares_dict = {x: x**2 for x in range(1, 11)}\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is lambda in Python? Write a lambda to sort a list of tuples by the second element.`,
        answer: `A lambda function is an anonymous, single-expression function declared using the "lambda" keyword without a "def" header. It is designed for short, inline operations.\nTo sort a list of tuples by their second element:\n\`\`\`python\ntuples_list.sort(key=lambda item: item[1])\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `How do you copy an object in Python? Explain shallow copy vs deep copy with examples.`,
        answer: `You copy objects using the built-in "copy" module.\nA Shallow copy (copy.copy()) generates a new outer container but maintains shared reference pointers to any nested child objects. A Deep copy (copy.deepcopy()) recursively duplicates all nested children, creating a completely independent copy on the heap:\n\n\`\`\`python\nimport copy\noriginal = [[1, 2]]\nshallow = copy.copy(original)\ndeep = copy.deepcopy(original)\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between range and xrange (Python 2 vs 3). How does range work in Python 3?`,
        answer: `In legacy Python 2, "range" allocated a full, static list of integers in memory, while "xrange" returned an on-demand generator sequence. In Python 3, "xrange" was deprecated and "range" was updated to act as an immutable lazy sequence type. It generates numbers on the fly, consuming minimal memory (O(1) space complexity) regardless of the range's size.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are generators in Python? How are they different from lists? Write a generator for Fibonacci numbers.`,
        answer: `Generators are functions that return an iterator lazily, using the "yield" keyword to emit values sequentially. Unlike lists (which load their entire dataset into memory at once), generators maintain their execution state, computing each value on the fly to conserve memory:\n\n\`\`\`python\ndef fib_gen(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are iterators in Python? Difference between iterator and iterable.`,
        answer: `An iterable is an object that contains elements and can return an iterator when passed to iter() (e.g., lists, strings). An iterator is the stateful stream object that traverses the elements, fetching them sequentially when passed to next() and raising a StopIteration exception once the sequence is exhausted.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is *args and **kwargs? Write a function that accepts any number of arguments and keyword arguments.`,
        answer: `- "*args" allows a function to accept any number of positional arguments, which are packed into a tuple.\n- "**kwargs" allows a function to accept any number of keyword arguments, which are packed into a dictionary.\n\n\`\`\`python\ndef flex_func(*args, **kwargs):\n    print(args)   # Tuple\n    print(kwargs) # Dictionary\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is pickling and unpickling? When would you use it?`,
        answer: `Pickling is the process of converting a Python object structure into a byte stream for storage or transmission. Unpickling is the inverse operation, converting a byte stream back into a live Python object. It is commonly used to cache trained machine learning model states or save application sessions directly to disk.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are decorators? Where do you use them in production? (logging, authentication, timing)`,
        answer: `Decorators wrap functions or classes to dynamically modify or audit their behavior. In production environments, they are commonly used to handle cross-cutting concerns like logging API requests, enforcing user authorization and authentication boundaries, or capturing database query execution times to monitor latency.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is the GIL (Global Interpreter Lock)? How does it affect multithreading in Python?`,
        answer: `The GIL (Global Interpreter Lock) is a physical mutex lock in the CPython interpreter that ensures only one thread can execute Python bytecode at a time. It prevents parallel execution of CPU-bound multi-threaded programs. While multithreading works well for I/O-bound tasks (which spend time waiting for network or disk operations), CPU-bound parallel execution must utilize the "multiprocessing" module to bypass the GIL.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between multiprocessing and multithreading in Python. When to use which?`,
        answer: `Multithreading runs multiple threads inside a single shared memory process space; it is highly efficient but constrained by the GIL, making it best for network or disk I/O tasks. Multiprocessing spawns completely separate operating system processes, each with its own memory space and Python interpreter; it bypasses the GIL entirely, making it the ideal choice for heavy CPU-bound mathematical operations.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is MRO (Method Resolution Order) in Python? How does multiple inheritance work?`,
        answer: `MRO is the linear lookup order Python uses to resolve class attributes or methods when dealing with multiple inheritance. Python calculates this order dynamically using the C3 Linearization algorithm. You can inspect a class's lookup order by calling ClassName.mro() or ClassName.__mro__.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between __new__ and __init__? When is __new__ used?`,
        answer: `- "__new__" is the static constructor method responsible for physically allocating and returning a new object instance. It is called first.\n- "__init__" is the initializer method responsible for setting initial values and attributes on the instance returned by __new__.\n"__new__" is overridden when inheriting from immutable types (like tuple or str) or implementing the Singleton design pattern.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is PYTHONPATH? What are help() and dir() functions used for?`,
        answer: `- "PYTHONPATH" is an environment variable containing directory paths that the Python interpreter scans to resolve imported modules.\n- "help()" is a built-in utility that prints documentation and docstrings for a module, class, or function.\n- "dir()" is a diagnostic utility that returns a list of valid attributes and methods available on an object.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between .py and .pyc files. How is Python interpreted?`,
        answer: `.py files contain raw, readable Python source code. .pyc files contain compiled, platform-independent bytecode generated by the interpreter. When you execute a Python program, the virtual machine compiles your .py source code to bytecode first (cached in .pyc format inside __pycache__ folders), and then executes it using the runtime interpreter engine.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Are arguments passed by value or reference in Python? Explain with example.`,
        answer: `Python operates strictly using "Pass by Object Reference" (or "Pass by Assignment"). If you pass a mutable object (like a list) to a method, it passes a copy of the pointer reference; changing list elements will modify the original list. If you pass an immutable object (like an integer), reassigning the variable inside the function simply rebinds the local pointer to a new value, leaving the original variable unchanged.`,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Difference between is and == in Python. When would is return True but == return False?`,
        answer: `The "==" operator checks for value equality (checking if the contents of two objects are structurally identical). The "is" operator checks for identity equality (verifying if both variables point to the exact same memory address). "is" will never evaluate to True when "==" is False, because pointing to the identical memory address always implies structural value equality.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `Why are mutable default arguments dangerous? Write code demonstrating the issue and fix it.`,
        answer: `Default arguments are evaluated only once when the function is defined. If you use a mutable object (like an empty list) as a default argument, all subsequent function calls will share that identical list instance, causing data leaks across calls:\n\n\`\`\`python\n# Dangerous\ndef append_to(val, target=[]):\n    target.append(val)\n\n# Correct Fix\ndef append_to(val, target=None):\n    if target is None:\n        target = []\n    target.append(val)\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is if __name__ == "__main__"? Why is it used?`,
        answer: `Every Python file defines a special variable named "__name__". If a file is executed directly as the entry point, Python sets "__name__" to "__main__". If the file is imported as a module elsewhere, "__name__" is set to the file's name. This check is used to define test blocks or execution entry points that should only run when the file is executed directly.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What are negative indexes in Python? Why are they used?`,
        answer: `Negative indexes allow you to query a sequence starting from the end, moving from right to left. Index -1 returns the last element, -2 returns the second to last, and so on. They are used to access trailing elements without needing to calculate the sequence's length dynamically.`,
        difficulty: 'Easy',
        isCompanySpecific: false
    },
    {
        topic: 'Python',
        question: `What is duck typing in Python? Give a real-world example.`,
        answer: `Duck Typing is a dynamic typing philosophy summarized by: "If it walks like a duck and quacks like a duck, it is a duck." Python does not check an object's strict class inheritance; instead, it checks for the presence of the required method or attribute. For example, any object that implements a "read" method can be treated as a readable file.`,
        difficulty: 'Medium',
        isCompanySpecific: false
    },

    // =========================================================================
    // === COMPANY SPECIFIC MOCK INTERVIEW DECKS (isCompanySpecific: true) ===
    // =========================================================================
    {
        topic: 'Python',
        question: `[Google Tech Assessment] Write a Python function that takes a variable number of positional arguments and returns their sum and product.`,
        answer: `We utilize the *args positional packing parameter syntax:\n\n\`\`\`python\ndef compute_stats(*args):\n    if not args:\n        return 0, 0\n    total_sum = sum(args)\n    total_prod = 1\n    for num in args:\n        total_prod *= num\n    return total_sum, total_prod\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Google'
    },
    {
        topic: 'Python',
        question: `[Microsoft Technical Round] Write a program that takes a sequence of numbers and checks if all numbers are unique in O(n) time.`,
        answer: `We leverage a set lookup, which operates with O(1) complexity, to scan the list in a single pass:\n\n\`\`\`python\ndef check_unique(numbers):\n    seen = set()\n    for num in numbers:\n        if num in seen:\n            return False\n        seen.add(num)\n    return True\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Microsoft'
    },
    {
        topic: 'Python',
        question: `[Amazon Coding Assessment] Write a program to count the frequency of every character in a text file using memory-efficient streams.`,
        answer: `We read the file character by character or line by line inside a buffer stream to prevent loading the entire file into memory:\n\n\`\`\`python\nfrom collections import Counter\ndef count_file_chars(filepath):\n    counts = Counter()\n    with open(filepath, 'r') as file:\n        for line in file:\n            counts.update(line)\n    return counts\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Amazon'
    },
    {
        topic: 'Python',
        question: `[TCS Ninja Track Assessment] Write a function that returns the indices of two numbers in an array that add up to a target value.`,
        answer: `We solve this in O(n) time using a hash map to look up targets dynamically:\n\n\`\`\`python\ndef two_sum(nums, target):\n    lookup = {}\n    for idx, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], idx]\n        lookup[num] = idx\n    return []\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'TCS'
    },
    {
        topic: 'Python',
        question: `[Deloitte Consulting Case Assessment] Write a program to add two positive integers without using the "+" operator.`,
        answer: `We simulate a half-adder using bitwise operations: XOR calculates the sum without carrying, while AND shifted left by 1 calculates the carries:\n\n\`\`\`python\ndef add_bitwise(a, b):\n    while b != 0:\n        carry = a & b\n        a = a ^ b\n        b = carry << 1\n    return a\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Deloitte'
    },
    {
        topic: 'Python',
        question: `[Infosys Edge Assessment] Write a regex pattern matching script to match a string that has the letter 'a' followed by 4 to 8 'b's.`,
        answer: `We use Python's built-in "re" module with the pattern 'ab{4,8}$':\n\n\`\`\`python\nimport re\ndef match_pattern(text):\n    pattern = r'^ab{4,8}$'\n    return bool(re.match(pattern, text))\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Infosys'
    },
    {
        topic: 'Python',
        // Fixed: Swapped mixed-up label back to correct schema parameters
        question: `[Accenture Technology Assessment] Write a program to convert date formats from yyyy-mm-dd format to dd-mm-yyyy format.`,
        answer: `We parse the string by splitting it along dashes and rearranging the indices:\n\n\`\`\`python\ndef convert_date(date_str):\n    parts = date_str.split('-')\n    return f"{parts[2]}-{parts[1]}-{parts[0]}"\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Accenture'
    },
    {
        topic: 'Python',
        question: `[Wipro Elite Assessment] Write a program to combine two dictionaries. If duplicate keys exist, add their values together.`,
        answer: `We copy the first dictionary and iterate through the second, dynamically updating or adding values:\n\n\`\`\`python\ndef combine_dicts(d1, d2):\n    res = d1.copy()\n    for k, v in d2.items():\n        res[k] = res.get(k, 0) + v\n    return res\n\`\`\``,
        difficulty: 'Easy',
        isCompanySpecific: true,
        targetCompany: 'Wipro'
    },
    {
        topic: 'Python',
        question: `[Capgemini Technical Round] Write a function to check if a string containing parentheses like (), {}, [] is balanced.`,
        answer: `We use a stack to track open brackets, popping them off to verify matching closing brackets:\n\n\`\`\`python\ndef is_balanced(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping.values():\n            stack.append(char)\n        elif char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return False\n    return len(stack) == 0\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Capgemini'
    },
    {
        topic: 'Python',
        question: `[Cognizant GenC Assessment] Write a function that finds the length of the longest substring without repeating characters.`,
        answer: `We implement a sliding window approach with two pointers to scan the string in a single pass:\n\n\`\`\`python\ndef longest_substring(s):\n    seen = {}\n    start = max_len = 0\n    for idx, char in enumerate(s):\n        if char in seen and seen[char] >= start:\n            start = seen[char] + 1\n        seen[char] = idx\n        max_len = max(max_len, idx - start + 1)\n    return max_len\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Cognizant'
    },
    {
        topic: 'Python',
        question: `[Google Core Engineering] Write a function that groups words that are anagrams of each other from a given list.`,
        answer: `We use sorted characters as a hash map key to group anagram words together:\n\n\`\`\`python\nfrom collections import defaultdict\ndef group_anagrams(words):\n    groups = defaultdict(list)\n    for word in words:\n        sorted_word = "".join(sorted(word))\n        groups[sorted_word].append(word)\n    return list(groups.values())\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Google'
    },
    {
        topic: 'Python',
        question: `[Microsoft Core Track] Design an LRU (Least Recently Used) cache with O(1) get and put operations.`,
        answer: `We implement this in Python using a doubly linked list paired with a hash map, or directly using OrderedDict:\n\n\`\`\`python\nfrom collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cache = OrderedDict()\n        self.capacity = capacity\n    def get(self, key):\n        if key not in self.cache:\n            return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key, value):\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            self.cache.popitem(last=False)\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Microsoft'
    },
    {
        topic: 'Python',
        question: `[Amazon Web Services Round] Write a function that converts a nested dictionary into dot notation. Example: {'a': {'b': 1}} -> {'a.b': 1}`,
        answer: `We recurse through the dictionary structures, tracking the keys using a string list buffer:\n\n\`\`\`python\ndef flatten_dict(d, parent_key='', sep='.'):\n    items = {}\n    for k, v in d.items():\n        new_key = f"{parent_key}{sep}{k}" if parent_key else k\n        if isinstance(v, dict):\n            items.update(flatten_dict(v, new_key, sep=sep))\n        else:\n            items[new_key] = v\n    return items\n\`\`\``,
        difficulty: 'Hard',
        isCompanySpecific: true,
        targetCompany: 'Amazon'
    },
    {
        topic: 'Python',
        question: `[TCS Digital Assessment] Write a function to detect if a linked list has a cycle using Floyd's cycle-finding algorithm.`,
        answer: `We use two node reference pointers (slow and fast); if they meet, a loop exists:\n\n\`\`\`python\ndef has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True\n    return False\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'TCS'
    },
    {
        topic: 'Python',
        question: `[Deloitte Consulting Architecture] Write code that demonstrates what happens when modifying a list while iterating over it, then show the fix.`,
        answer: `Modifying a list while iterating over it skips elements because list indices shift dynamically. The correct approach is to iterate over a copy of the list or use a list comprehension:\n\n\`\`\`python\n# Broken\nnums = [1, 2, 3]\nfor x in nums:\n    if x == 2: nums.remove(x)\n\n# Corrected\nnums = [x for x in nums if x != 2]\n\`\`\``,
        difficulty: 'Medium',
        isCompanySpecific: true,
        targetCompany: 'Deloitte'
    }
];

const seedDB = async () => {
    try {
        console.log("Connecting database system core...");
        await mongoose.connect("mongodb://127.0.0.1:27017/interviewPrep");
        
        // Remove old Java and Python records to clear duplicates cleanly
        await Question.deleteMany({ topic: { $in: ['Java', 'Python'] } });
        console.log("Stale Java and Python datasets dropped.");

        await Question.insertMany(combinedComprehensiveDataset);
        console.log(`✓ Seeded ${combinedComprehensiveDataset.length} premium records (Split into General Quiz and Company Specific Decks)`);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedDB();   